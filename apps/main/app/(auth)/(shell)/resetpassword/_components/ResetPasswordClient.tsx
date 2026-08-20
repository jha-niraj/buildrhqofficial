"use client";

import { Suspense } from "react";
// import { AppProvider } from "@/app/context/store";
import ResetPassword from "./resetpassword";

export default function Profile() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div>
                <ResetPassword />
            </div>
        </Suspense>
    );
}