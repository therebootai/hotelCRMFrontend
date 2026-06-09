import React from "react";
import CheckInForm from "../../components/checkinComp/CheckinForm";

const DirectCheckInPage = () => {
  return (
    <div className="p-4 sm:p-8 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <CheckInForm inline={true} />
      </div>
    </div>
  );
};

export default DirectCheckInPage;
