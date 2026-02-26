import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
    loadAvailability,
    saveAvailability,
    loadAppointments,
    saveAppointments,
    loadOnlineStatus,
    saveOnlineStatus,
    Appointment,
    DayAvailability,
    formatTime,
    formatPhoneNumber,
    isPastTime,
} from "@/lib/appointments";
import { Stethoscope, LogOut, Check, X, Clock, Calendar, Settings, Search as SearchIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// According to App.tsx, IS_LOGGED_IN_KEY is imported from Login.tsx
import { IS_LOGGED_IN_KEY as LOGIN_KEY } from "./Login";

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [availability, setAvailability] = useState<DayAvailability[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [searchPhone, setSearchPhone] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const load = () => {
            setAppointments(loadAppointments());
            setAvailability(loadAvailability());
            setIsOnline(loadOnlineStatus());
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAvailabilityChange = (index: number, field: keyof DayAvailability, value: any) => {
        const updated = [...availability];
        updated[index] = { ...updated[index], [field]: value };
        setAvailability(updated);
    };

    const handleSaveAvailability = () => {
        saveAvailability(availability);
        toast({
            title: "Availability Updated",
            description: "Your schedule has been saved successfully.",
        });
    };

    const handleLogout = () => {
        localStorage.removeItem(LOGIN_KEY);
        navigate("/login");
    };

    const handleStatusChange = (id: string, status: Appointment['status']) => {
        const updated = appointments.map(apt => apt.id === id ? { ...apt, status } : apt);
        setAppointments(updated);
        saveAppointments(updated);
        toast({
            title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            description: `Appointment has been ${status}.`,
        });
    };

    const handleDeleteAppointment = (id: string) => {
        const updated = appointments.filter(apt => apt.id !== id);
        setAppointments(updated);
        saveAppointments(updated);
        toast({
            title: "Appointment Deleted",
            description: "Appointment has been permanently removed from the records.",
        });
    };

    const toggleOnline = (checked: boolean) => {
        setIsOnline(checked);
        saveOnlineStatus(checked);
        toast({
            title: checked ? "In Clinic" : "Away",
            description: `Your status is now ${checked ? 'online' : 'offline'}.`,
        });
    };

    // Only show future/ongoing pending and approved appointments in the main view
    // Filter out 'rejected' status as per user request (should not be displayed anywhere)
    const pendingApts = appointments.filter(a => a.status === 'pending' && !isPastTime(a.date, a.time));
    const activeApts = appointments.filter(a => a.status === 'approved' && !isPastTime(a.date, a.time));

    // Search logic for the separate search tab
    const filteredApts = appointments.filter(apt => {
        if (apt.status === 'rejected') return false; // Rejected appointments are hidden everywhere
        const matchesName = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = searchDate ? apt.date === searchDate : true;
        const matchesPhone = searchPhone ? apt.patientPhone.includes(searchPhone) : true;
        return matchesName && matchesDate && matchesPhone;
    });

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <h1 className="text-xl font-display font-bold">Doctor Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm font-medium">Online Status</span>
                            <Switch checked={isOnline} onCheckedChange={toggleOnline} />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="dashboard" className="space-y-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="dashboard" className="gap-2">
                            <Clock className="w-4 h-4" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="search" className="gap-2">
                            <SearchIcon className="w-4 h-4" /> Search Appointments
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2">
                            <Settings className="w-4 h-4" /> Schedule
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-8">
                        {/* Pending Requests */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary" /> Pending Requests
                            </h2>
                            <div className="grid gap-4">
                                {pendingApts.length === 0 ? (
                                    <Card><CardContent className="py-8 text-center text-muted-foreground">No active pending appointments</CardContent></Card>
                                ) : (
                                    pendingApts.map(apt => (
                                        <Card key={apt.id}>
                                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-lg">{apt.patientName}</p>
                                                    <p className="text-sm text-muted-foreground">{formatPhoneNumber(apt.patientPhone)}</p>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline">{apt.day}, {apt.date}</Badge>
                                                        <Badge className="bg-primary">{formatTime(apt.time)}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <Button className="flex-1 sm:flex-none" onClick={() => handleStatusChange(apt.id, 'approved')}>
                                                        <Check className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button variant="destructive" className="flex-1 sm:flex-none" onClick={() => handleStatusChange(apt.id, 'rejected')}>
                                                        <X className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Recent Active Appointments */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-primary" /> Upcoming Appointments
                            </h2>
                            <div className="space-y-6">
                                {activeApts.length === 0 ? (
                                    <Card><CardContent className="py-8 text-center text-muted-foreground">No upcoming approved appointments</CardContent></Card>
                                ) : (() => {
                                    const sortedApts = [...activeApts].sort((a, b) => {
                                        if (a.date !== b.date) return a.date.localeCompare(b.date);
                                        return a.time.localeCompare(b.time);
                                    });

                                    const groups: { [key: string]: Appointment[] } = {};
                                    sortedApts.forEach(apt => {
                                        const key = `${apt.day}, ${apt.date}`;
                                        if (!groups[key]) groups[key] = [];
                                        groups[key].push(apt);
                                    });

                                    return Object.entries(groups).map(([dateLabel, apts]) => (
                                        <div key={dateLabel} className="space-y-3">
                                            <h3 className="text-sm font-semibold text-muted-foreground bg-muted/30 px-3 py-1 rounded-md inline-block">
                                                {dateLabel}
                                            </h3>
                                            <div className="grid gap-4">
                                                {apts.map(apt => (
                                                    <Card key={apt.id} className="opacity-80">
                                                        <CardContent className="p-4 flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <p className="font-medium">{apt.patientName}</p>
                                                                <p className="text-xs text-muted-foreground">{formatTime(apt.time)}</p>
                                                            </div>
                                                            <Badge variant="default">
                                                                {apt.status}
                                                            </Badge>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="search" className="space-y-6">
                        <section className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <Label>Patient Name</Label>
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        placeholder="Search by number..."
                                        value={searchPhone}
                                        onChange={(e) => setSearchPhone(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={searchDate}
                                        onChange={(e) => setSearchDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <h3 className="font-semibold text-muted-foreground">Search Results ({filteredApts.length})</h3>
                                {filteredApts.length === 0 ? (
                                    <Card><CardContent className="py-8 text-center text-muted-foreground">No appointments match your search</CardContent></Card>
                                ) : (
                                    <div className="grid gap-3">
                                        {filteredApts.map(apt => (
                                            <Card key={apt.id}>
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-bold">{apt.patientName}</p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                            <span>{formatPhoneNumber(apt.patientPhone)}</span>
                                                            <span>•</span>
                                                            <span>{apt.day}, {apt.date}</span>
                                                            <span>•</span>
                                                            <span>{formatTime(apt.time)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge variant={
                                                            apt.status === 'approved' ? 'default' :
                                                                apt.status === 'cancelled' ? 'secondary' : 'outline'
                                                        }>
                                                            {apt.status}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteAppointment(apt.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-primary" /> Availability Settings
                            </h2>
                            <div className="grid gap-4">
                                {availability.map((dayConfig, index) => (
                                    <Card key={dayConfig.day}>
                                        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-[150px]">
                                                <Switch
                                                    checked={dayConfig.enabled}
                                                    onCheckedChange={(checked) => handleAvailabilityChange(index, 'enabled', checked)}
                                                />
                                                <span className={`font-bold ${dayConfig.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {dayConfig.day}
                                                </span>
                                            </div>

                                            {dayConfig.enabled && (
                                                <div className="flex flex-wrap items-center gap-4 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`start-${dayConfig.day}`} className="text-xs text-muted-foreground whitespace-nowrap">Start Time</Label>
                                                        <Input
                                                            id={`start-${dayConfig.day}`}
                                                            type="time"
                                                            value={dayConfig.startTime}
                                                            className="w-32"
                                                            onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`end-${dayConfig.day}`} className="text-xs text-muted-foreground whitespace-nowrap">End Time</Label>
                                                        <Input
                                                            id={`end-${dayConfig.day}`}
                                                            type="time"
                                                            value={dayConfig.endTime}
                                                            className="w-32"
                                                            onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`duration-${dayConfig.day}`} className="text-xs text-muted-foreground whitespace-nowrap">Slot (min)</Label>
                                                        <Input
                                                            id={`duration-${dayConfig.day}`}
                                                            type="number"
                                                            value={dayConfig.slotDuration}
                                                            className="w-20"
                                                            min="5"
                                                            step="5"
                                                            onChange={(e) => handleAvailabilityChange(index, 'slotDuration', parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {!dayConfig.enabled && (
                                                <p className="text-sm text-muted-foreground italic">Availability disabled for this day.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                                <Button className="w-full md:w-auto self-end" onClick={handleSaveAvailability}>
                                    Save Availability Changes
                                </Button>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default DoctorDashboard;
