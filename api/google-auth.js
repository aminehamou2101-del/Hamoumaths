export function GET() {
  return new Response("HAMOU MATH API OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
