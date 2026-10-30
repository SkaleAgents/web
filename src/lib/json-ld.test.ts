import { expect, it } from "vitest";
import { articleJsonLd, itemListJsonLd, jsonLd, productJsonLd } from "@/lib/json-ld";

const page = { title: "Threat model </script>", description: "Copy it.", path: "/prompts/1", datePublished: "2026-10-01" };

it("wraps one node with a context and several nodes in a graph", () => {
  expect(JSON.parse(jsonLd(articleJsonLd(page)))).toMatchObject({ "@context": "https://schema.org", "@type": "Article", headline: page.title, datePublished: "2026-10-01" });
  const graph = JSON.parse(jsonLd([articleJsonLd(page), productJsonLd(page)])) as { "@graph": { "@type": string }[] };
  expect(graph["@graph"].map((node) => node["@type"])).toEqual(["Article", "Product"]);
});

it("escapes < so a title cannot close the script tag", () => {
  expect(jsonLd(articleJsonLd(page))).not.toContain("</script>");
});

it("omits a missing publish date and prices products at zero", () => {
  expect(articleJsonLd({ ...page, datePublished: undefined })).not.toHaveProperty("datePublished");
  expect(productJsonLd(page).offers).toMatchObject({ price: "0", priceCurrency: "USD", url: "https://skaleagents.com/prompts/1" });
});

it("numbers list items from one", () => {
  expect(itemListJsonLd([{ name: "A", url: "https://a.test" }, { name: "B", url: "https://b.test" }]).itemListElement.map((item) => item.position)).toEqual([1, 2]);
});
