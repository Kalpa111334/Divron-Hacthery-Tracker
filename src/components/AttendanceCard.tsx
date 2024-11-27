import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export const AttendanceCard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkUser();
    fetchTodayAttendance();
    return () => clearInterval(timer);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const fetchTodayAttendance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", session.user.id)
      .gte("created_at", today.toISOString())
      .lt("created_at", new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (!error && data && data.length > 0) {
      setTodayAttendance(data[0]);
    }
  };

  const handleAttendance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please login to mark attendance");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      if (!todayAttendance) {
        // Clock in
        const { error } = await supabase
          .from("attendance")
          .insert({
            employee_id: session.user.id,
            check_in: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success("Clocked in successfully!");
      } else if (!todayAttendance.check_out) {
        // Clock out
        const { error } = await supabase
          .from("attendance")
          .update({
            check_out: new Date().toISOString(),
          })
          .eq("id", todayAttendance.id);

        if (error) throw error;
        toast.success("Clocked out successfully!");
      }
      fetchTodayAttendance();
    } catch (error: any) {
      toast.error(error.message || "Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (!todayAttendance) return "Clock In";
    if (!todayAttendance.check_out) return "Clock Out";
    return "Attendance Completed";
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format(currentTime, "hh:mm:ss a")}
        </div>
        <p className="text-xs text-muted-foreground">Current Time</p>
        {todayAttendance && (
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              Clock In: {format(new Date(todayAttendance.check_in), "hh:mm a")}
            </p>
            {todayAttendance.check_out && (
              <p className="text-sm">
                Clock Out: {format(new Date(todayAttendance.check_out), "hh:mm a")}
              </p>
            )}
          </div>
        )}
        <Button
          onClick={handleAttendance}
          className="mt-4 w-full"
          disabled={loading || (todayAttendance && todayAttendance.check_out)}
        >
          {loading ? "Processing..." : getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
};