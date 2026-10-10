"use client";

// import Home from "@/components/dashboard/Home";
import Main from "@/components/dashboard/Main";
import Wrapper from "@/components/common/Wrapper";
import AuthGuard from "../../components/AuthGuard";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

const Dashboard: React.FC = () => {
  return (
    <AuthGuard>
      <Wrapper>
        {/* <Home /> */}
        <Main/>
        <AnalyticsDashboard />
        <div className="mt-3">

        </div>
      </Wrapper>
    </AuthGuard>
  );
};

export default Dashboard;
