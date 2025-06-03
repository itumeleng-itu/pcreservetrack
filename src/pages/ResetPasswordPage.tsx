
import React from "react";
import { ResetPassword } from "@/components/auth/ResetPassword";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center auth-container">
      <div className="w-full max-w-md px-4">
        <ResetPassword onComplete={() => window.location.href = '/auth'} />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
