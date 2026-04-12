import { useLocation, useNavigate } from "react-router-dom";
import InvoiceTemplate from "../components/InvoiceTemplate";
import { useEffect, useState } from "react";

function InvoicePreview() {

  const location = useLocation();
   const { invoice, show,images } = location.state;

const navigate = useNavigate();
  // ✅ ADD THIS
  // useEffect(() => {
  //   setTimeout(() => {
  //     window.print();
  //   }, 400);
  // }, []);
  const handlePrint = () => {
    window.print();
  };
  const handleBack = () => {
    //navigate(-1); // go back with same state
    navigate(`/invoices/edit/${invoice.id}`,{ state: { invoice, images } });
  };
  return (
    <div>
      {/* Print Button */} 
      <div className="no-print toolbar d-flex justify-content-between mb-2"> 
        <button className="btn btn-primary" onClick={handlePrint}> Print Invoice </button> 
        {show && (<button className="btn btn-secondary" onClick={handleBack}> Back </button> )} 
        </div>
    <div className="print-area">

      {/* Page 1 */}
      <div className="invoice-copy">
        <InvoiceTemplate invoice={invoice} copyType="Customer Copy" />
      </div>

    {/* PRINT ONLY */}
    <div className="print-only">
        {/* Page 2 */}
        {images?.length > 0 && (
          <div className="back-page">
            <h5 className="text-center">Invoice item pictures</h5>
            <div className="image-grid">
              {images.map((img, index) => (
                <div className="image-box" key={index}>
                  <img src={img.data} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page 3 */}
        <div className="invoice-copy">
          <InvoiceTemplate invoice={invoice} copyType="Merchant Copy" />
        </div>
      </div>

    </div>
    </div>
    
  );
}

export default InvoicePreview;