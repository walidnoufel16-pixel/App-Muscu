/* Légendes d'un pack en Word (.docx), prêtes à copier-coller : l'ordre de publication, puis pour
   chaque publication un bloc gris par texte (légende, titre et description YouTube, commentaire à épingler).
   Usage : NODE_PATH=$(npm root -g) node outils/reseaux/legendes-docx.js \
             docs/reseaux/semaine-N/legendes.md docs/reseaux/semaine-N/Legendes-pack-N.docx ["Vidéo 1,Carrousel 1"]
   Le 3e argument (facultatif) : les publications déjà parues, marquées « déjà publiée ».
   Format attendu de legendes.md : le tableau « Calendrier » (| Jour | Quoi | Où | Heure |, « Quoi »
   commence par « Vidéo n » ou « Carrousel n ») ; une section « ## Vidéo n · fichier · « titre » » par
   publication, avec la légende dans un bloc de code et les lignes « Titre : `…` », « Description : `…` »,
   « Commentaire à épingler : `…` ». Ensuite : retirer les dossiers du zip (zip -d fichier.docx avec le motif « tout dossier »), puis rendu (soffice → PDF) à regarder. */
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle } = require("docx");
const md = fs.readFileSync(process.argv[2], "utf8");
const secs = md.split(/^## /m).slice(1).filter((s) => /^(Vidéo|Carrousel)/.test(s));
/* le calendrier : | Jour | Quoi | Où | Heure | */
const CAL = md.split("\n").map((l) => l.split("|").map((c) => c.trim())).filter((c) => c.length >= 6 && /^(Vidéo|Carrousel) \d+/.test(c[2]))
  .map((c) => ({ n: c[2].match(/^(Vidéo|Carrousel) \d+/)[0], jour: c[1], ou: c[3], heure: c[4] }));
const ORDRE = CAL.map((c) => c.n);
const QUAND = Object.fromEntries(CAL.map((c) => [c.n, `${c.jour} · ${c.heure}`]));
const OU = Object.fromEntries(CAL.map((c) => [c.n, c.ou]));
const FAIT = new Set((process.argv[4] || "").split(",").map((x) => x.trim()).filter(Boolean));
const F = "Arial";
const bloc = (lignes) => lignes.map((l, i) => new Paragraph({
  children: [new TextRun({ text: l, font: F, size: 22 })],
  shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEF2F1" },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: "2DD4BF", space: 8 } },
  spacing: { before: i === 0 ? 60 : 0, after: i === lignes.length - 1 ? 200 : 0 }, indent: { left: 160, right: 160 },
}));
const etiq = (t) => new Paragraph({ children: [new TextRun({ text: t, font: F, size: 20, bold: true, color: "555555" })], spacing: { before: 160, after: 40 }, keepNext: true });
const corps = [];
const pack = (md.match(/^# Pack semaine (\d+)/m) || [])[1] ?? "";
corps.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(`Pack semaine ${pack} · textes à copier-coller`)] }));
corps.push(new Paragraph({ children: [new TextRun({ text: "Chaque bloc gris se copie tel quel : appui long sur le texte, « Tout sélectionner » dans le bloc, puis copier.", font: F, size: 20, color: "555555" })], spacing: { after: 200 } }));
const W = [2400, 3600, 3026];
const cell = (t, w, b) => new TableCell({ width: { size: w, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, font: F, size: 20, bold: b })] })], shading: b ? { type: ShadingType.CLEAR, color: "auto", fill: "D9F5F1" } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } });
const parNom = Object.fromEntries(secs.map((s) => [s.match(/^((?:Vidéo|Carrousel) \d+)/)[1], s]));
for (const n of ORDRE) if (!parNom[n]) throw new Error(`${n} : section absente de legendes.md`);
corps.push(new Table({ width: { size: 9026, type: WidthType.DXA }, columnWidths: W, rows: [
  new TableRow({ children: [cell("Quand", W[0], true), cell("Contenu", W[1], true), cell("Où", W[2], true)] }),
  ...ORDRE.map((n) => { const s = parNom[n]; const titre = s.split("\n")[0].split(" · ").slice(2).join(" · ");
    return new TableRow({ children: [cell(QUAND[n] + (FAIT.has(n) ? " (publiée)" : ""), W[0]), cell(n + " · " + titre, W[1]), cell(OU[n], W[2])] }); }),
] }));
for (const n of ORDRE) {
  const s = parNom[n], titre = s.split("\n")[0].split(" · ").slice(2).join(" · ");
  corps.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`${n} · ${titre}`)] }));
  corps.push(new Paragraph({ children: [new TextRun({ text: QUAND[n] + (FAIT.has(n) ? " · déjà publiée, pour référence" : ""), font: F, size: 20, italics: true, color: FAIT.has(n) ? "999999" : "0F766E" })], spacing: { after: 60 } }));
  const code = s.match(/```\n([\s\S]*?)\n```/)[1].split("\n");
  corps.push(etiq(n.startsWith("Vidéo") ? "Légende TikTok / Instagram" : "Légende Instagram (et TikTok en mode photo)"));
  corps.push(...bloc(code));
  for (const [k, lab] of [["Titre", "Titre YouTube"], ["Description", "Description YouTube"], ["Commentaire à épingler", "Commentaire à épingler"]]) {
    const m = s.match(new RegExp("^" + k + " : `([^`]*)`", "m"));
    if (m) { corps.push(etiq(lab)); corps.push(...bloc([m[1]])); }
  }
}
corps.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Répondre aux commentaires")] }));
for (const t of ["Réponds à tous les commentaires dans la première heure.", "On te demande le nom de l'app : « Oxa, lien dans la bio 👆 ».", "Jamais de promesse de résultat chiffré ni de conseil médical (une douleur : « vois un pro de santé »)."])
  corps.push(new Paragraph({ children: [new TextRun({ text: "– " + t, font: F, size: 22 })], spacing: { after: 60 } }));
const doc = new Document({
  styles: { default: { document: { run: { font: F, size: 22 } } }, paragraphStyles: [
    { id: "Title", name: "Title", basedOn: "Normal", run: { font: F, size: 40, bold: true, color: "0A0A0C" }, paragraph: { spacing: { before: 0, after: 120 }, keepNext: true } },
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { font: F, size: 28, bold: true, color: "0F766E" }, paragraph: { spacing: { before: 360, after: 40 }, keepNext: true, outlineLevel: 0 } },
  ] },
  sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: corps }],
});
Packer.toBuffer(doc).then((b) => fs.writeFileSync(process.argv[3], b));
