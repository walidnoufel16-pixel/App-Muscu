import { VueListe, metaListe } from "../../blog/vues";

/* Blog en anglais : mêmes pages que /blog, textes de lib/data/blog-en.ts. */
export const metadata = metaListe("en");
export default function PageBlogEn() {
  return <VueListe l="en" />;
}
