export default function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({
      success: false,
      error: "Method Not Allowed"
    });
  }

  return response.status(200).json({
    success: true,
    message: "HAMOU MATH API OK"
  });
}
