export default async function handler(req,res){

  if(req.method!=="POST"){

    return res.status(405).json({
      error:"Method not allowed"
    });

  }

  try{

    const {
      product,
      currency,
      amount
    } = req.body || {};

    if(!product){

      return res.status(400).json({
        error:"Product is required"
      });

    }

    /*
     * لا نثق بالمبلغ القادم من المتصفح.
     *
     * في الإنتاج:
     *
     * 1. نقرأ السعر من قاعدة البيانات.
     * 2. نتحقق من المستخدم.
     * 3. نتحقق من الخطة.
     * 4. ننشئ عملية الدفع في بوابة الدفع.
     * 5. نحفظ transaction.
     * 6. ننتظر webhook.
     */

    const supportedCurrencies = [
      "DZD",
      "EUR",
      "USD",
      "GBP",
      "CAD"
    ];

    const selectedCurrency =
      supportedCurrencies.includes(currency)
      ? currency
      : "DZD";

    return res.status(501).json({

      ok:false,

      error:
        "Payment gateway is not configured yet.",

      requested:{
        product,
        currency:selectedCurrency,
        amount
      },

      next:
        "Connect the endpoint to your activated Algerian payment gateway."

    });

  }catch(error){

    console.error(error);

    return res.status(500).json({
      error:"Payment server error"
    });

  }

}
