export default async function handler(req,res){

  if(req.method!=="POST"){

    return res.status(405).json({
      error:"Method not allowed"
    });

  }

  try{

    /*
     * هنا يتم التحقق من توقيع بوابة الدفع.
     *
     * لا نعتبر العميل مدفوعًا
     * اعتمادًا على redirect فقط.
     *
     * الحالة الصحيحة:
     *
     * gateway
     *       ↓
     * webhook
     *       ↓
     * verify signature
     *       ↓
     * database
     *       ↓
     * subscription = active
     */

    return res.status(200).json({
      received:true
    });

  }catch(error){

    console.error(error);

    return res.status(500).json({
      error:"Webhook error"
    });

  }

}
