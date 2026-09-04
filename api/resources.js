export default async function handler(req,res){

  if(req.method!=="GET"){

    return res.status(405).json({
      error:"Method not allowed"
    });

  }

  const {
    page="1",
    limit="20",
    language="",
    type="",
    level=""
  } = req.query;

  const currentPage =
    Math.max(
      parseInt(page,10)||1,
      1
    );

  const pageSize =
    Math.min(
      Math.max(
        parseInt(limit,10)||20,
        1
      ),
      100
    );

  return res.status(200).json({

    ok:true,

    filters:{
      language,
      type,
      level
    },

    pagination:{
      page:currentPage,
      limit:pageSize
    },

    data:[],

    architecture:
      "Database-backed pagination"

  });

}
