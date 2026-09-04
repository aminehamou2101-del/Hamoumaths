export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error:"Method not allowed"
    });
  }

  const {
    q = "",
    language = "",
    type = "",
    level = "",
    page = "1",
    limit = "20"
  } = req.query;

  /*
   * V25:
   * هذه نقطة API.
   *
   * في البداية نعيد نتائج تجريبية.
   *
   * عند ربط Supabase/Postgres:
   * SELECT ...
   * FROM resources
   * WHERE ...
   * ORDER BY ...
   * LIMIT ...
   * OFFSET ...
   */

  const pageNumber =
    Math.max(parseInt(page,10) || 1,1);

  const pageSize =
    Math.min(
      Math.max(parseInt(limit,10) || 20,1),
      100
    );

  return res.status(200).json({

    ok:true,

    query:{
      q,
      language,
      type,
      level
    },

    pagination:{
      page:pageNumber,
      limit:pageSize
    },

    results:[],

    message:
      "Connect this endpoint to Supabase/PostgreSQL full-text search."

  });

}
