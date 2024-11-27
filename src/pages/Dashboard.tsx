import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { AttendanceCard } from "@/components/AttendanceCard";
import { LeaveRequestForm } from "@/components/LeaveRequestForm";
import { AdminDashboard } from "@/components/AdminDashboard";
import { NotificationBell } from "@/components/NotificationBell";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("User");
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .single();

      if (error) throw error;
      if (profile) {
        setFullName(profile.full_name);
        setIsAdmin(profile.role === "admin");
      }
    } catch (error: any) {
      toast.error(error.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Error signing out");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {fullName}!</h1>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
      <div className="grid gap-6">
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <DashboardStats />
            <div className="grid md:grid-cols-2 gap-6">
              <AttendanceCard />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Submit Leave Request</h2>
                <LeaveRequestForm />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;