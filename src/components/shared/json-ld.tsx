/**
 * Renders one JSON-LD block, or nothing.
 *
 * A server component with no state and no client cost — the script tag is part
 * of the prerendered HTML, which is where a crawler needs to find it.
 *
 * `data` being nullable is the point: the builders in `lib/structured-data.ts`
 * return null when the CMS cannot back the claim they would make, and this
 * renders nothing for that rather than an object full of empty strings.
 *
 * `JSON.stringify` output goes into the tag via `dangerouslySetInnerHTML`
 * because React would otherwise HTML-escape it and produce invalid JSON-LD.
 * That is safe here in a way it usually is not: the input is an object this
 * codebase built, serialised by `JSON.stringify`, so the only characters that
 * could close the tag early are escaped below. Nothing user-supplied is
 * interpolated as markup.
 */
export function JsonLd({ data }: { data: object | null }) {
  if (!data) return null;

  // `</script>` inside a string value would end the tag; `<` is the same
  // character to a JSON parser and inert to an HTML one. The same trick covers
  // the `<!--` sequence, which also terminates a script block.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
