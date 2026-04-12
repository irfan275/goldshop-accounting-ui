import { useEffect, useState } from "react";
import "../css/invoice.css";
import { getCustomerById } from "../services/customerService";
import { getShopById, getShops } from "../services/userService";
import { getInvoiceById } from "../services/ledgerService";

function InvoiceTemplate({ invoice ,copyType}) {
  const [customer,setCustomer] = useState({});
  //const [invoice,setInvoice] = useState(invoice1);
  const [shop,setShop] = useState({});
  const [name,setName] = useState("");
  useEffect(() => {
    const loadCustomer = async () => {
      const res = await getCustomerById(invoice.customerId._id);
      setCustomer(res.data.data || []);
    };
  
    loadCustomer();
  }, []);
  // useEffect(() => {
  //   const loadInvoice = async () => {
  //     const res = await getInvoiceById(invoice._id);
  //     setInvoice(res.data.data || []);
  //   };
  //   if(invoice._id)
  //     loadInvoice();
  // }, []);
    useEffect(() => {
      fetchShop();
    }, []);
    const fetchShop = async () => {
      const response = await getShopById(invoice.shop._id);
      setShop(response.data.data || []);
    };
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setName(user.name);
  }, [name]);
  const minRows = 6; // minimum rows to keep table height fixed
  const items = invoice?.items || []; // dynamic items
  const emptyRows = minRows - items.length > 0 ? minRows - items.length : 0;
  const getNoteLines = (text) => {
  if (!text) return ["", ""];

  const lines = text.split("\n");

  return [
    lines[0] || "",
    lines[1] || ""
  ];
};
const [line1, line2] = getNoteLines(invoice.notes);
const totals = items.reduce(
  (acc, item) => {
    const weight = Number(item.weight) || 0;
    const price = Number(item.price) || 0;

    if (item.type === "Gold") {
      acc.goldWeight += weight;
      acc.goldPrice += price;
    }

    if (item.type === "Silver") {
      acc.silverWeight += weight;
      acc.silverPrice += price;
    }

    return acc;
  },
  {
    goldWeight: 0,
    goldPrice: 0,
    silverWeight: 0,
    silverPrice: 0
  }
);
const goldRate = totals.goldWeight
  ? totals.goldPrice / totals.goldWeight
  : 0;

const silverRate = totals.silverWeight
  ? totals.silverPrice / totals.silverWeight
  : 0;
  return (
    <div className="invoice" style={{ width: '150mm', padding: '2mm', fontSize: '10px', lineHeight: '1.1' }}>

      {/* ===== HEADER ===== */}
      <div className="header flex justify-between w-full mb-1">
        {/* Left Side: Logo + Subtitle */}
        <div className="left-block" style={{ width: '240px' }}>
        <div
            className="logo-block font-bold"
            style={{
                fontSize: '42px',
                lineHeight: '1',
                border: '2px solid #000', // black box
                color: '#fff',
                textAlign: 'left',
                fontWeight: 'bold',
                padding: '3px 20px',
            }}
            >
            MUSCAT<br />BULLION
            </div>

          <div className="subtitle mt-1" style={{ fontSize: '11px', lineHeight: '1' }}>
            <div><strong>Sale of Gold & Silver Bullion</strong></div>
            <div><strong>بيع سبائك الذهب والفضة</strong></div>
          </div>
        </div>

        {/* Right Side: Company Block */}
        <div className="company-block text-left" style={{ fontSize: '12px', lineHeight: '1.5' }}>
          <div>MUSCAT INTERNATIONAL BULLION L.L.C</div>
          <div>مسقط الدولية للسبائك ذ.م.م</div>
          <div>{shop.address}</div>
          <div>{shop.address_ar}</div>
          {/* <div>{shop.address}</div>
          <div>{shop.address_ar}</div>  */}
          {/* <div>P.O Box: 3062, PC:112, Ruwi, Sultanate of Oman</div>
          <div>ص.ب.: 3062، الرمز البريدي: 112، روي، سلطنة عمان</div> */}
          {/* <div>P.O Box: 590, PC:117, Wadi Al Kabir</div>
          <div>ص.ب.: 590، الرمز البريدي: 117، وادي الكبير</div> */}
          <div>www.muscatbullion.com</div>
          <div>VATIN: OM1100325835</div>
          <div><strong>Tel: +968 24827434, 24714741</strong></div>
        </div>
      </div>

      {/* ===== TITLE ===== */}
      <div
  style={{
    position: "relative",
    margin: "4px 0",
    textAlign: "center"
  }}
>
  {/* Center Title */}
  <div
    className="title"
    style={{
      fontSize: "11px",
      fontWeight: "bold"
    }}
  >
          TAX INVOICE | فاتورة ضريبية
        </div>

        {/* Right Side Copy */}
        <strong
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            textDecoration: "underline",
            color: "#666",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          {copyType}
        </strong>
      </div>
      
      <div
          className=""
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px"
          }}
        >
          <strong>To.</strong>
          
        </div>

      {/* ===== CUSTOMER + INVOICE ===== */}
      <div className="info-section flex justify-between w-full m-0 lh-1">

        {/* Customer Box */}
        <table className="customer-box border border-black border-collapse" style={{ fontSize: '9px', width: '49%' }}>
          <tbody>
            <tr><td colSpan="2" className="p-1 fw-bold"><b>{customer.name}</b></td></tr>
            <tr><td className="p-1">Nationality | جنسية</td><td className="p-1">{customer.address}</td></tr>
            <tr><td className="p-1">Telephone No. | رقم الهاتف</td><td className="p-1">{customer.phone}</td></tr>
            <tr><td className="p-1">C/O | شخص مسؤول</td><td className="p-1">{customer.name}</td></tr>
            <tr><td className="p-1">CR/ID No. | الرقم المدني/ رقم السجل</td><td className="p-1">{customer.civilId}</td></tr>
            <tr style={{ height: "20px" }}><td className="p-1" ></td><td className="p-1"></td></tr>
            {/* <tr><td className="p-1">Card Expiry | انتهاء صلاحية البطاقة</td><td className="p-1">{customer.cardExpiry}</td></tr> */}
          </tbody>
        </table>

        {/* Invoice Box */}
        <table className="invoice-box border border-black border-collapse" style={{ fontSize: '9px', width: '49%' }}>
          <tbody>
            <tr><td className="p-1">Invoice No | رقم الفاتورة</td><td className="p-1">{invoice.invoiceNumber}</td></tr>
            <tr><td className="p-1">Date | تاريخ</td><td className="p-1">{invoice.invoiceDate}</td></tr>
            <tr><td className="p-1">Prepared By | أُعدت بواسطة</td><td className="p-1">{name}</td></tr>
            <tr><td className="p-1">Branch | فرع</td><td className="p-1">{shop.name}</td></tr>
            <tr><td className="p-1">Customer Type | نوع العميل</td><td className="p-1">{customer.type}</td></tr>
          </tbody>
        </table>

      </div>

      {/* ===== ITEMS TABLE ===== */}

<table
  className="items border border-black border-collapse w-full mb-1"
  style={{ fontSize: "9px" }}
>
  <thead style={{ backgroundColor: "#e5e5e5" }}>
    <tr>
      <th className="p-1 border border-black">No<br />رقم</th>
      <th className="p-1 border border-black">Item Description<br />وصف السلعة</th>
      <th className="p-1 border border-black">PCS<br />قِطَع</th>
      <th className="p-1 border border-black">Purity<br />نقاء</th>
      <th className="p-1 border border-black">Pure Wt<br />وزن</th>
      <th className="p-1 border border-black">Value<br />قيمة</th>
      <th className="p-1 border border-black">Premium<br />غالي</th>
      <th className="p-1 border border-black">Amount (OMR)<br />المبلغ (بالريال العماني)</th>
    </tr>
  </thead>

  <tbody>
    {/* Dynamic Items */}
    {items.map((item, i) => (
      <tr key={i}>
        <td className="p-1 border border-black">{i + 1}</td>
        <td className="p-1 border border-black">{item.itemId?.name}</td>
        <td className="p-1 border border-black">{item.quantity}</td>
        <td className="p-1 border border-black">{item.purity.toFixed(1)}</td>
        <td className="p-1 border border-black">{item.weight}</td>
        <td className="p-1 border border-black">{item.price.toFixed(3)}</td>
        <td className="p-1 border border-black">{item.premium.toFixed(3)}</td>
        <td className="p-1 border border-black">{item.total.toFixed(3)}</td>
      </tr>
    ))}

    {/* Empty rows to maintain height */}
    {Array.from({ length: emptyRows }).map((_, i) => (
      <tr key={"empty" + i}>
        <td className="p-1 border border-black">&nbsp;</td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
        <td className="p-1 border border-black"></td>
      </tr>
    ))}

    {/* Totals */}
    <tr>
      <td colSpan="2" className="p-1 border border-black text-start">Sub Total | المجموع الفرعي</td>
      <td className="p-1 border border-black">{items.reduce((sum, i) => sum + i.quantity, 0)}</td>
      <td className="p-1 border border-black"></td>
      <td className="p-1 border border-black">{items.reduce((sum, i) => sum + i.weight, 0)}</td>
      <td className="p-1 border border-black">{(items.reduce((sum, i) => sum + i.price, 0)).toFixed(3)}</td>
      <td className="p-1 border border-black">{(items.reduce((sum, i) => sum + i.premium, 0)).toFixed(3)}</td>
      <td className="p-1 border border-black">{(invoice.subTotal).toFixed(3)}</td>
    </tr>

    <tr>
      <td colSpan="5" className="p-1 border border-black text-start">VAT (5%) On Workmanship | ضريبة القيمة المضافة (٥٪) على المصنعية</td>
      <td className="p-1 border border-black">5%</td>
      <td className="p-1 border border-black"></td>
      <td className="p-1 border border-black">{(invoice.vat).toFixed(3)}</td>
    </tr>

    <tr style={{ backgroundColor: "#e5e5e5" }}>
      <td colSpan="7" className="p-1 border border-black text-start fw-bold" >Totals | المجموع</td>
      <td className="p-1 border border-black">{invoice.total.toFixed(3)}</td>
    </tr>

    <tr>
      <td colSpan="7" className="p-1 border border-black text-start">Discount | تخفيض</td>
      <td className="p-1 border border-black">{invoice.discount.toFixed(3)}</td>
    </tr>

    <tr style={{ backgroundColor: "#e5e5e5" }}>
      <td colSpan="7" className="p-1 border border-black fw-bold" >
        Total Amount Due | المبلغ الإجمالي المستحق
      </td>
      <td className="p-1 border border-black fw-bold">{invoice.finalTotal.toFixed(3)}</td>
    </tr>
  </tbody>
</table>

      {/* ===== NOTES ===== */}
      <table className="notes border border-black border-collapse w-full m-0 lh-1 " style={{ fontSize: '10px',width: '100%' }}>
        <tbody>
          <tr style={{ height: "20px" }}>
            <td rowSpan={2} className="font-semibold p-1 border border-black text-center align-middle" style={{width:'20%'}}>Notes | ملحوظات</td>
            <td className="p-1 border border-black">{line1}</td>
          </tr>
          <tr style={{ height: "20px" }}>
            <td className="p-1 border border-black">{line2}</td>
          </tr>
        </tbody>
      </table>

      {/* ===== REMARKS ===== */}
      <div
        className="remarks mb-1"
        style={{
          fontSize: "9px",
          display: "flex"
        }}
      >
        <b style={{ width: "80px" }}>Remarks | ملاحظات</b>

        <div>
          {totals.goldWeight > 0 && (
            <span> <strong>Gold: </strong>
              {totals.goldWeight.toFixed(3)} 24K Grams SALE @ {goldRate.toFixed(3)} OMR Per Gram
            </span>
          )}

          {totals.goldWeight > 0 && totals.silverWeight > 0 && "  |  "}

          {totals.silverWeight > 0 && (
            
            <span>
              <strong>Silver: </strong>
              {totals.silverWeight.toFixed(3)} Grams SALE @ {silverRate.toFixed(3)} OMR Per Gram
            </span>
          )}
        </div>
      </div>
      {/* ===== TERMS ===== */}
<table
  className="w-full border border-black border-collapse mb-1"
  style={{ fontSize: "9px", tableLayout: "fixed" }}
>
  <tbody>
    <tr>
      <td
        style={{ width: "52%" }}
        className="p-1 align-top"
      >
        "If any items in this invoice will be refunded with only Gold/Silver Value at Spot Rate"
        <br />
        I hereby confirm above information to cash declaration has been completed accurately
        to best of my knowledge and belief with Anti- Money Laundering and Combating the
        Financing of Terrorism policy of Central Bank of Oman with specific regards being
        made to the Know Your Customer / Due Diligence procedures contained therein.
      </td>

      <td
        style={{ width: "50%",fontSize:'10.5px' }}
        className="p-1 align-top"
        dir="rtl"
      >
        إذا كان هناك أي عناصر في هذه الفاتورة سيتم ردها بقيمة الذهب والفضة" "فقط بالسعر الفوري
        <br />
        أؤكد من خلال خبرتي أن المعلومات المذكورة أعلاه للإقرار النقدي قد تم استكمالها بدقة
        وفقًا لمعرفتي واعتقادي مع سياسة مكافحة غسل الأموال ومكافحة تمويل الإرهاب التي يتبعها
        البنك المركزي العماني مع اعتبارات محددة بشأن معرفة عميلك / إجراءات العناية الواجبة
        الواردة فيها.
      </td>
    </tr>
  </tbody>
</table>

      {/* ===== SIGNATURES ===== */}
      <div>
        <span>Confirmed for & Behalf of |  تم التأكيد نيابة عن     </span>
        </div>
        <div
          className="mt-1"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px"
          }}
        >
          <strong>{customer.name}</strong>
          <strong>For MUSCAT BULLION</strong>
        </div>
        
      
      <div className="signatures flex justify-between mt-4">
        <div className="text-center w-1/3" >
          <hr className="border-black" />
          <span className="block mt-1 text-sm" >Customer Name & Signature</span><br/>
          <span style={{lineHeight: '3'}}>اسم العميل وتوقيعه</span>
        </div>
        <div className="text-center w-1/3">
          <hr className="border-black" />
          <span className="block mt-1 text-sm">Checked By</span><br/>
          <span style={{lineHeight: '3'}}>تم الفحص بواسطة</span>
        </div>
        <div className="text-center w-1/3">
          <hr className="border-black" />
          <span className="block mt-1 text-sm">Authorized Signatory</span><br/>
          <span style={{lineHeight: '3'}}>المفوض بالتوقيع</span>
        </div>
      </div>

    </div>
  );
}

export default InvoiceTemplate;