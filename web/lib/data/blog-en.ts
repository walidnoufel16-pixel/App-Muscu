/* Blog Oxa en anglais : chaque article du blog (lib/data/blog.ts), adapté (pas traduit mot à mot)
   pour les recherches en anglais, rangé sous son identifiant français. Les programmes viennent des
   mêmes données que l'app, avec les noms anglais des exercices et des textes. */
import { EX } from "./exercices";
import { FAMILLES_STREET, PROGRAMMES_STREET } from "./street";
import EX_EN from "@/lib/i18n/exercices.en.json";
import EN from "@/lib/i18n/en.json";
import type { Bloc } from "./blog";

export type Texte = { slug: string; titre: string; description: string; intro: string; blocs: Bloc[]; cta: string };

const name = (id: string) => (EX_EN as Record<string, string[]>)[id]?.[0] ?? EX[id]?.n ?? id;
const en = (s: string) => (EN as Record<string, string>)[s] ?? s;
const found = PROGRAMMES_STREET.find((p) => p.niv === "debutant")!;
const pull = FAMILLES_STREET.find((f) => f.k === "tirage")!.ex;

export const BLOG_EN: Record<string, Texte> = {
  "preparer-premier-hyrox": {
    slug: "hyrox-training-plan-beginners",
    titre: "Hyrox training plan for beginners: how to prepare for your first race",
    description: "The Hyrox format explained, the 8 stations and their weights, how many weeks you need, a sample training week and the mistakes that cost you on race day.",
    intro: "8 kilometres of running, broken up by 8 workout stations: that's Hyrox in a nutshell. The fitness race filling exhibition halls around the world is within reach of anyone who trains regularly, as long as you prepare the right way. A first Hyrox usually takes between 1 h 15 and 1 h 45. Here's how to get there without burning out.",
    blocs: [
      {
        h: "The format",
        p: ["Run 1 km, do a station, run again, eight times over. The order never changes. Open division weights (men / women):"],
        liste: [
          "1. SkiErg: 1000 m",
          "2. Sled push: 50 m (152 / 102 kg, sled included)",
          "3. Sled pull: 50 m (103 / 78 kg)",
          "4. Burpee broad jumps: 80 m",
          "5. Rowing: 1000 m",
          "6. Farmer's carry: 200 m (2 × 24 / 2 × 16 kg)",
          "7. Sandbag lunges: 100 m (20 / 10 kg)",
          "8. Wall balls: 100 reps (6 / 4 kg)",
        ],
      },
      { h: "How long do you need to prepare?", p: ["Allow 8 to 12 weeks if you already run a little and lift weights. If you're starting from zero on the running side, give yourself 12 weeks and begin with three easy runs a week before adding the stations.", "Running makes up more than half of your total time: build it first. The stations are quick to learn; the kilometres aren't."] },
      {
        h: "A sample training week",
        liste: [
          "One “run + stations” session: 4 to 8 rounds of 1 km followed by a station. This is the key workout: it teaches you to run on heavy legs.",
          "Two easy runs, at a pace where you can hold a conversation.",
          "One threshold or interval session, for speed.",
          "One or two strength sessions: lunges, squats, Romanian deadlifts, rows, loaded carries.",
        ],
        p: ["Build up gradually: four rounds of 500 m at first, then six rounds, then a full simulation three to four weeks before race day. Ease off in the final week."],
      },
      {
        h: "Mistakes that cost you",
        liste: [
          "Going out too fast on the first kilometre: the adrenaline makes you pay for it at the sled.",
          "Neglecting the running in favour of the stations.",
          "Trying to do all 100 wall balls unbroken: split them into sets of 10 to 15 from the start, before you're spent.",
          "Never practising the run-to-station transition: it's what surprises people the most.",
          "Meeting the sled for the first time on race day: its weight and the floor change everything, so try one at a gym.",
        ],
      },
      { h: "No SkiErg or sled at your gym?", p: ["Not a problem for training. Use band pull-downs or burpees instead of the SkiErg, walking lunges or pushing against a wall instead of the sled, and thrusters or jump squats instead of wall balls. Still try to find a fully equipped gym for one or two sessions before the race."] },
    ],
    cta: "Build your Hyrox plan in Oxa: run + station sessions, weights for your division and no-machine alternatives",
  },
  "creatine-a-quoi-ca-sert": {
    slug: "creatine-benefits-dosage-safety",
    titre: "Creatine: what it really does, how much to take, and is it safe?",
    description: "What creatine does, the dose that works (3 to 5 g a day), what we know about kidneys, hair loss and water retention, and who it's actually useful for.",
    intro: "It's the most studied supplement in sport, and one of the few whose effect is recognised by the European Food Safety Authority (EFSA). That doesn't make it a shortcut: it helps you do a bit more work in training, nothing more. Here's what to know before you buy any.",
    blocs: [
      { h: "What it does", p: ["Creatine is stored in your muscles as phosphocreatine, an energy reserve for very short, intense efforts: a set of lifts, a sprint, a jump. Topping up that reserve lets you squeeze out an extra rep or two, or recover better between efforts.", "EFSA recognises that it improves performance in short, intense, repeated bouts of exercise, from 3 g a day. Over weeks, that small extra workload can turn into a bit more strength and muscle. It doesn't help pure endurance, like an easy run."] },
      {
        h: "How much to take",
        liste: [
          "3 to 5 g of creatine monohydrate a day, every day, at any time. Monohydrate is the most studied and cheapest form: other forms haven't shown anything better.",
          "A loading phase (20 g a day for a week) is optional: at 3 to 5 g a day, your stores are full after 3 to 4 weeks.",
          "No need for cycles or breaks.",
        ],
      },
      {
        h: "Common myths",
        liste: [
          "“It damages your kidneys”: in healthy people, at recommended doses, studies haven't shown harmful effects. If you have kidney disease, ask your doctor first.",
          "“It makes your hair fall out”: this worry comes from a single small 2009 study on a hormone, never replicated, which didn't measure hair loss.",
          "“It makes you bloated”: the scale may go up 1 to 2 kg in the first weeks, water stored inside the muscle, not under the skin.",
          "“It's doping”: no, creatine isn't banned and is naturally found in meat and fish.",
        ],
      },
      { h: "Who is it for?", p: ["It's useful if you lift, do calisthenics or play sports with repeated efforts, and already train regularly. It doesn't replace training, sleep or enough protein. It isn't recommended under 18, and if you're pregnant or on medication, ask a health professional. Choose a product that lists its composition, ideally tested for banned substances."] },
    ],
    cta: "What really makes the difference is consistency: Oxa builds your sessions and tracks your progress",
  },
  "combien-de-proteines-par-jour": {
    slug: "how-much-protein-per-day-build-muscle",
    titre: "How much protein per day do you need to build muscle?",
    description: "How much protein you really need when lifting, how to spread it over the day, and how much common foods provide.",
    intro: "Protein is the raw material of muscle, but you don't need to eat huge amounts of it. There's a range that works, and beyond it you gain nothing. Here's how to work out yours.",
    blocs: [
      { h: "The right number", p: ["For the general population, health authorities recommend about 0.8 g of protein per kilo of body weight per day. When you lift to build muscle, studies put the need at around 1.6 g per kilo per day; above 2.2 g there's no measurable benefit.", "Example: at 70 kg (154 lb), aim for about 110 g of protein a day. At 60 kg (132 lb), about 95 g."] },
      {
        h: "Spread it over the day",
        liste: [
          "Three or four servings of 20 to 40 g, rather than one huge meal in the evening.",
          "One serving in the hours after your workout, without counting the minutes: the “anabolic window” is much wider than people say.",
          "A protein snack if your meals don't get you to your total: cottage cheese, Greek yogurt or skyr, hard-boiled eggs.",
        ],
      },
      {
        h: "How much common foods provide",
        liste: [
          "100 g cooked chicken breast: about 30 g",
          "100 g canned tuna: about 25 g",
          "2 large eggs: about 13 g",
          "150 g skyr or Greek yogurt: 12 to 15 g",
          "100 g firm tofu: 12 to 15 g",
          "200 g cooked lentils: about 18 g",
          "60 g rolled oats: about 8 g",
        ],
      },
      { h: "What about protein powder?", p: ["Protein powder is just a convenient food, not a must. It can help you hit your total, but eggs, dairy, beans and lentils, and some meat or fish do the job just as well, often for less. Calories matter too: if you don't eat enough overall, muscle grows poorly, even with plenty of protein."] },
    ],
    cta: "Track today's protein in Oxa: scan your products and the app adds it up for you",
  },
  "entrainement-hybride-muscu-course": {
    slug: "hybrid-training-lifting-and-running",
    titre: "Hybrid training: lifting and running in the same week without burning out",
    description: "Combining strength training and running: the interference effect, how to schedule your sessions, and two sample weeks depending on your priority.",
    intro: "Strong and fit at the same time: that's the idea behind hybrid training, made popular by Hyrox. People used to say running eats your muscle. In reality, with a bit of planning, the two complement each other very well.",
    blocs: [
      { h: "The interference effect, for real", p: ["Studies show that a large volume of endurance work can slightly slow strength and muscle gains, especially in the legs. But the effect stays modest when most of your running is easy and your sessions are well placed. For most people, doing both gives better health and fitness results than either alone."] },
      {
        h: "The rules that change everything",
        liste: [
          "80% of your running at an easy pace: you should be able to talk. Keep hard sessions to one or two a week.",
          "If lifting and running fall on the same day, leave at least 6 hours between them, or start with your priority.",
          "No heavy leg session the day before a hard run, and vice versa.",
          "Increase your running volume gradually: no more than 10% a week.",
          "Eat and sleep accordingly: two kinds of training means more energy spent.",
        ],
      },
      {
        h: "Two sample weeks",
        tableau: [
          { titre: "Muscle first (3 lifting + 2 runs)", lignes: ["Monday: upper body", "Tuesday: easy run, 30 to 40 min", "Wednesday: legs", "Friday: full body", "Sunday: easy long run"] },
          { titre: "Running first (2 lifting + 3 runs)", lignes: ["Monday: full body", "Tuesday: intervals or threshold", "Thursday: easy run + upper body", "Saturday: easy run", "Sunday: long run"] },
        ],
      },
      { h: "What about combined sessions?", p: ["When time is short, a session that chains lifting and a cardio block works too: lift first if strength is your goal, cardio first if you're training for a race. Keep it for busy weeks rather than making it the rule."] },
    ],
    cta: "Combine your sessions in Oxa: lifting, running and combined workouts in one place",
  },
  "programme-street-workout-debutant": {
    slug: "calisthenics-workout-plan-beginners",
    titre: "Calisthenics workout plan for beginners: 3 sessions a week",
    description: "A beginner calisthenics plan: 3 full-body sessions a week, with bodyweight and a pull-up bar, for your first pull-up, your first dips and clean push-ups.",
    intro: `New to calisthenics? No need to chase the moves you see on Instagram: the foundation is three full-body sessions a week, with exercises you can actually do and progress. Here is Oxa's “${en(found.nom)}” plan, designed for ${en(found.pour).toLowerCase()}.`,
    blocs: [
      { h: "The goal", p: [`${en(found.but)} By the end of the cycle: ${en(found.objectif).toLowerCase()}.`] },
      {
        h: "The three sessions",
        p: ["Do them in order, with at least one rest day in between (for example Monday, Wednesday, Friday). Numbers are sets × reps (or seconds for holds)."],
        tableau: found.seances.map((s) => ({ titre: `Session ${s.k} · ${en(s.nom)}`, lignes: s.ex.map((e) => `${name(e.id)}: ${e.s} × ${e.r}${EX[e.id]?.ch === "temps" ? " s" : ""}, rest ${en(e.p)}`) })),
      },
      {
        h: "How to progress",
        liste: [
          `Stay within ${en(found.fourchette).toLowerCase()}: when all your sets reach the top of the range, move to the harder version of the same movement.`,
          "Keep one or two reps in reserve: technique first, going to failure won't make you progress faster.",
          "Every 5 to 6 weeks, take a lighter week (half the sets), then retake your level test.",
        ],
      },
      { h: "Too easy?", p: ["Oxa has an entry test (max pull-ups, push-ups, dips and squats) that places you at the right level: Foundations, Strength or Skills."] },
    ],
    cta: "Take the level test in Oxa",
  },
  "premiere-traction": {
    slug: "how-to-do-your-first-pull-up",
    titre: "How to do your first pull-up: the step-by-step progression",
    description: "Can't do a pull-up yet? The full progression, from the dead hang to the strict pull-up, and how long to stay at each step.",
    intro: "The pull-up is the king of calisthenics moves, and the most frustrating at first: zero reps is normal. The good news is there's a ladder of exercises that leads to your first pull-up, usually in 6 to 12 weeks with 2 to 3 sessions a week.",
    blocs: [
      {
        h: "The ladder, from easiest to hardest",
        liste: pull.slice(0, 7).map((id, i) => `${i + 1}. ${name(id)}`),
        p: ["Move to the next step when you can do 3 clean sets at the top of the range (for example 3 × 8). Not before: skipping a step often means getting stuck later."],
      },
      {
        h: "The three key exercises",
        liste: [
          `${name("susp")}: 3 × 20 to 60 seconds. It builds your grip and gets your shoulders used to carrying your weight.`,
          `${name("ra")}: 3 × 8 to 12, under a low bar. It's the same movement as the pull-up, done horizontally; the further your feet go forward, the harder it gets.`,
          `${name("trneg")}: 3 × 3 to 5. Get to the top with help (a chair, a jump), then lower yourself over 3 to 5 seconds. The phase that builds the most strength.`,
        ],
      },
      {
        h: "Mistakes that slow everything down",
        liste: [
          "Half reps: go down to straight arms on every rep.",
          "Training every day: your back and arm muscles grow while you rest.",
          "Forgetting your shoulder blades: pull them down before bending your arms (scapular pull-ups teach this).",
        ],
      },
    ],
    cta: "Follow the progression in Oxa",
  },
  "seance-full-body-sans-materiel": {
    slug: "full-body-workout-no-equipment",
    titre: "Full-body workout with no equipment: 30 minutes at home",
    description: "A complete bodyweight workout with no equipment at all: legs, chest, back and core in 30 minutes. With easier and harder variations.",
    intro: "No gym, no equipment? Your bodyweight is enough to train your whole body, as long as you choose the right exercises and keep progressing them. Here's a 30-minute session to do 2 to 3 times a week.",
    blocs: [
      {
        h: "The workout",
        p: ["Warm up for 5 minutes (shoulder and hip circles, light squats), then go through the exercises with 60 to 90 seconds' rest between sets."],
        tableau: [{
          titre: "3 sets of each",
          lignes: [
            `${name("sqpc")}: 3 × 15`,
            `${name("pomp")}: 3 × 8 to 12 (on your knees or hands raised if it's too hard)`,
            `${name("fepc")}: 3 × 10 per leg`,
            `${name("pont")}: 3 × 15`,
            `${name("sup")}: 3 × 12, for your lower back`,
            `${name("gai")}: 3 × 30 to 45 seconds`,
          ],
        }],
      },
      {
        h: "Progressing the workout",
        liste: [
          "When all your sets feel easy, add 2 reps or 10 seconds.",
          "Then move to a harder variation: feet-elevated push-ups, jump squats, single-leg glute bridge.",
          "Your back gets little work without a bar: a doorway pull-up bar (around twenty euros) opens up pull-ups and inverted rows.",
        ],
      },
    ],
    cta: "Create your custom workout in Oxa",
  },
  "repas-prise-de-muscle-petit-budget": {
    slug: "cheap-high-protein-meals-build-muscle",
    titre: "Cheap high-protein meals: build muscle on a budget",
    description: "How much protein you need to build muscle, the cheapest foods per gram of protein, and a sample day on a tight budget.",
    intro: "Building muscle doesn't require powders or pricey products. Above all, you need enough protein every day, enough calories, and consistency. With a few simple foods, it's doable on a tight budget.",
    blocs: [
      { h: "How much protein?", p: ["Studies put the need at around 1.6 g of protein per kilo of body weight per day for people who lift (up to 2.2 g, with no extra benefit beyond). At 70 kg (154 lb), that's about 110 g a day, spread over 3 or 4 meals."] },
      {
        h: "The cheapest protein sources",
        liste: [
          "Eggs: whole, easy, among the cheapest per gram of protein.",
          "Lentils, chickpeas, dried beans: very cheap, pair them with grains (rice, pasta, bread).",
          "Cottage cheese and skyr in large tubs: high in protein, handy as a snack.",
          "Canned tuna and sardines, chicken breast in bulk packs, frozen lean ground beef.",
          "Oats and milk: a complete breakfast for a few cents.",
        ],
      },
      {
        h: "A sample day",
        liste: [
          "Breakfast: oats, milk, a banana.",
          "Lunch: rice, lentils, hard-boiled eggs, vegetables.",
          "Snack: cottage cheese and a handful of dried fruit.",
          "Dinner: pasta, tuna or chicken, vegetables, a little olive oil.",
        ],
      },
      { h: "Plan to spend less", p: ["Batch cooking twice a week and buying in bulk make the biggest difference. Oxa plans your meals for the week within your budget, with a shopping list and the estimated cost of each day."] },
    ],
    cta: "Plan your meals on a budget in Oxa",
  },
};
