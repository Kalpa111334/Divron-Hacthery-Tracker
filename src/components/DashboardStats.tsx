import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CalendarDays, UserCheck, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

export const DashboardStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data: weeklyAttendance, error: weeklyError } = await supabase
        .from("attendance")
        .select("*")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      if (weeklyError) throw weeklyError;

      const { data: leaveRequests, error: leaveError } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("status", "approved");

      if (leaveError) throw leaveError;

      return {
        weeklyAttendance: weeklyAttendance?.length || 0,
        averageHours: weeklyAttendance?.reduce((acc, curr) => {
          if (curr.check_in && curr.check_out) {
            const hours = (new Date(curr.check_out).getTime() - new Date(curr.check_in).getTime()) / (1000 * 60 * 60);
            return acc + hours;
          }
          return acc;
        }, 0) / (weeklyAttendance?.length || 1),
        leaveBalance: 20 - (leaveRequests?.length || 0), // Assuming 20 days annual leave
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Attendance</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.weeklyAttendance || 0} days</div>
          <p className="text-xs text-muted-foreground">This Week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.averageHours ? stats.averageHours.toFixed(1) : 0}h
          </div>
          <p className="text-xs text-muted-foreground">Per Day</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.leaveBalance || 20}</div>
          <p className="text-xs text-muted-foreground">Days Remaining</p>
        </CardContent>
      </Card>
    </div>
  );
};