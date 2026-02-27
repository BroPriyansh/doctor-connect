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
import { Stethoscope, LogOut, Check, X, Clock, Calendar, Settings, Search as SearchIcon, Trash2, Phone, User, CalendarDays, Plus } from "lucide-react";
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
        // Initial load
        setAppointments(loadAppointments());
        setAvailability(loadAvailability());
        setIsOnline(loadOnlineStatus());

        // Periodic polling only for appointments and online status
        // We DO NOT poll availability here because it would overwrite unsaved local changes
        const interval = setInterval(() => {
            setAppointments(loadAppointments());
            setIsOnline(loadOnlineStatus());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleAvailabilityChange = (dayIndex: number, field: string, value: any, shiftIndex?: number) => {
        const updated = [...availability];
        if (shiftIndex !== undefined) {
            const updatedShifts = [...updated[dayIndex].shifts];
            updatedShifts[shiftIndex] = { ...updatedShifts[shiftIndex], [field]: value };
            updated[dayIndex] = { ...updated[dayIndex], shifts: updatedShifts };
        } else {
            updated[dayIndex] = { ...updated[dayIndex], [field]: value };
        }
        setAvailability(updated);
    };

    const addShift = (dayIndex: number) => {
        const updated = [...availability];
        updated[dayIndex].shifts.push({ startTime: '09:00', endTime: '12:00' });
        setAvailability(updated);
    };

    const removeShift = (dayIndex: number, shiftIndex: number) => {
        const updated = [...availability];
        updated[dayIndex].shifts.splice(shiftIndex, 1);
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
            <header className="glass sticky top-0 z-50 border-b border-white/10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 interactive-card">
                            <Stethoscope className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-display font-bold gradient-text">Doctor Portal</h1>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Practice Management Suite</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 glass-card rounded-full px-5 py-2 border-white/20 shadow-inner">
                            <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Status</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase ${isOnline ? 'text-online' : 'text-offline'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                                <Switch checked={isOnline} onCheckedChange={toggleOnline} className="data-[state=checked]:bg-online" />
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive premium-button group">
                            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <Tabs defaultValue="dashboard" className="space-y-8">
                    <TabsList className="bg-muted/30 p-1.5 rounded-2xl ring-1 ring-border glass-card">
                        <TabsTrigger value="dashboard" className="gap-2 rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all font-bold">
                            <Clock className="w-4 h-4" /> Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="search" className="gap-2 rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all font-bold">
                            <SearchIcon className="w-4 h-4" /> Archive
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2 rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all font-bold">
                            <Settings className="w-4 h-4" /> Schedule
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="space-y-8">
                        {/* Pending Requests */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-display font-black flex items-center gap-3">
                                    <Clock className="w-8 h-8 text-primary" /> Pending Requests
                                </h2>
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1.5 rounded-full uppercase tracking-tighter">
                                    {pendingApts.length} New Requests
                                </Badge>
                            </div>
                            <div className="grid gap-4">
                                {pendingApts.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted italic text-muted-foreground font-medium">Ready for new patients</div>
                                ) : (
                                    pendingApts.map(apt => (
                                        <Card key={apt.id} className="border-none ring-1 ring-border shadow-md overflow-hidden interactive-card hover:ring-primary/30">
                                            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center text-secondary-foreground font-black text-xl shadow-inner border border-secondary/50">
                                                        {apt.patientName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-xl tracking-tight leading-none">{apt.patientName}</p>
                                                        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs">
                                                            <Phone className="w-3 h-3" />
                                                            {formatPhoneNumber(apt.patientPhone)}
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px] rounded-full px-2.5">
                                                                {apt.day}, {apt.date}
                                                            </Badge>
                                                            <Badge className="bg-primary text-primary-foreground font-black uppercase text-[9px] rounded-full px-2.5 shadow-sm">
                                                                {formatTime(apt.time)}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 w-full sm:w-auto">
                                                    <Button variant="outline" className="flex-1 sm:flex-none h-11 px-6 rounded-xl font-bold border-2 hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-95" onClick={() => handleStatusChange(apt.id, 'approved')}>
                                                        <Check className="w-4 h-4 mr-2 text-online" /> Approve
                                                    </Button>
                                                    <Button variant="ghost" className="flex-1 sm:flex-none h-11 px-6 rounded-xl font-bold text-destructive hover:bg-destructive/5 active:scale-95 transition-all outline outline-1 outline-destructive/20" onClick={() => handleStatusChange(apt.id, 'rejected')}>
                                                        <X className="w-4 h-4 mr-2" /> Reject
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Upcoming Appointments */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-display font-black flex items-center gap-3">
                                <CalendarDays className="w-8 h-8 text-primary" /> Upcoming Schedule
                            </h2>
                            <div className="grid gap-8">
                                {activeApts.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted italic text-muted-foreground font-medium">No appointments scheduled for the future</div>
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
                                        <div key={dateLabel} className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-black uppercase px-4 py-1.5 rounded-full ring-4 ring-primary/5">
                                                    {dateLabel}
                                                </Badge>
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-border to-transparent" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {apts.map(apt => (
                                                    <Card key={apt.id} className="border-none ring-1 ring-border shadow-sm overflow-hidden interactive-card bg-card/50 backdrop-blur-sm">
                                                        <CardContent className="p-5 flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-sm border border-primary/10">
                                                                    {apt.patientName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <p className="font-black text-foreground tracking-tight leading-none">{apt.patientName}</p>
                                                                    <p className="text-[10px] font-black uppercase text-primary tracking-tighter">{formatTime(apt.time)}</p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="default" className="text-[9px] font-black uppercase rounded-full px-2.5 shadow-sm">
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

                    <TabsContent value="search" className="space-y-8">
                        <section className="glass-card rounded-3xl p-8 space-y-8 ring-1 ring-border border-none">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-display font-black flex items-center gap-3">
                                    <SearchIcon className="w-8 h-8 text-primary" /> Appointment Archive
                                </h2>
                                <p className="text-muted-foreground font-medium">Search and manage historical patient records.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Patient Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search name..."
                                            className="pl-10 h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="e.g. 98765..."
                                            className="pl-10 h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                                            value={searchPhone}
                                            onChange={(e) => setSearchPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Filter by Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-10 h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                                            value={searchDate}
                                            onChange={(e) => setSearchDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-dashed border-border space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-xl tracking-tight">Search Results</h3>
                                    <Badge variant="outline" className="font-black px-4 rounded-full h-8 uppercase text-[10px] tracking-tight">{filteredApts.length} Records Found</Badge>
                                </div>

                                {filteredApts.length === 0 ? (
                                    <div className="text-center py-16 bg-muted/10 rounded-3xl border-2 border-dashed border-muted italic text-muted-foreground font-medium">No results match your criteria</div>
                                ) : (
                                    <div className="grid gap-3">
                                        {filteredApts.map(apt => (
                                            <Card key={apt.id} className="border-none ring-1 ring-border shadow-sm interactive-card">
                                                <CardContent className="p-5 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-xl shadow-inner border border-primary/10">
                                                            {apt.patientName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-lg tracking-tight leading-none">{apt.patientName}</p>
                                                            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-tight">
                                                                <span className="text-primary">{formatPhoneNumber(apt.patientPhone)}</span>
                                                                <span>•</span>
                                                                <span>{apt.day}, {apt.date}</span>
                                                                <span>•</span>
                                                                <span>{formatTime(apt.time)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant={
                                                            apt.status === 'approved' ? 'default' :
                                                                apt.status === 'cancelled' ? 'secondary' : 'outline'
                                                        } className="rounded-full font-black text-[9px] uppercase px-3 shadow-inner">
                                                            {apt.status}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 premium-button border border-destructive/10"
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
                        <section className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-display font-black flex items-center gap-3">
                                        <Calendar className="w-8 h-8 text-primary" /> Schedule Settings
                                    </h2>
                                    <p className="text-muted-foreground font-medium">Configure your weekly availability and slot durations.</p>
                                </div>
                                <Button className="h-12 px-8 rounded-xl font-black premium-button shadow-lg shadow-primary/20" onClick={handleSaveAvailability}>
                                    Apply Changes
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {availability.map((dayConfig, index) => (
                                    <Card key={dayConfig.day} className={`border-none ring-1 transition-all duration-300 ${dayConfig.enabled ? 'ring-primary/20 bg-card shadow-md' : 'ring-border bg-muted/20 opacity-75'}`}>
                                        <CardContent className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 min-w-[180px]">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dayConfig.enabled ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                                    <span className="font-black text-xs uppercase tracking-widest">{dayConfig.day.slice(0, 3)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black tracking-tight">{dayConfig.day}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={dayConfig.enabled}
                                                            onCheckedChange={(checked) => handleAvailabilityChange(index, 'enabled', checked)}
                                                            className="scale-90 data-[state=checked]:bg-primary"
                                                        />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                                            {dayConfig.enabled ? 'Accepting' : 'Blocked'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {dayConfig.enabled ? (
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid gap-3">
                                                        {dayConfig.shifts.map((shift, shiftIndex) => (
                                                            <div key={shiftIndex} className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-muted-foreground/5 relative group/shift">
                                                                <div className="space-y-1.5 flex-1 min-w-[120px]">
                                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5 ml-1">
                                                                        <Clock className="w-3 h-3" /> Shift {shiftIndex + 1} Start
                                                                    </Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={shift.startTime}
                                                                        className="h-11 rounded-xl border-2 focus-visible:ring-primary/20 font-bold"
                                                                        onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value, shiftIndex)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5 flex-1 min-w-[120px]">
                                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5 ml-1">
                                                                        <Clock className="w-3 h-3" /> Shift {shiftIndex + 1} End
                                                                    </Label>
                                                                    <Input
                                                                        type="time"
                                                                        value={shift.endTime}
                                                                        className="h-11 rounded-xl border-2 focus-visible:ring-primary/20 font-bold"
                                                                        onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value, shiftIndex)}
                                                                    />
                                                                </div>
                                                                {dayConfig.shifts.length > 1 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl mt-4"
                                                                        onClick={() => removeShift(index, shiftIndex)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4 pt-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-xl font-bold border-dashed border-2 text-primary hover:bg-primary/5"
                                                            onClick={() => addShift(index)}
                                                        >
                                                            <Plus className="w-4 h-4 mr-2" /> Add Another Shift
                                                        </Button>
                                                        <div className="space-y-1.5 w-full sm:w-32">
                                                            <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5 ml-1">
                                                                <Settings className="w-3 h-3" /> Slot (min)
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={dayConfig.slotDuration}
                                                                className="h-11 rounded-xl border-2 focus-visible:ring-primary/20 font-bold"
                                                                min="5"
                                                                step="5"
                                                                onChange={(e) => handleAvailabilityChange(index, 'slotDuration', parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 py-4 px-6 rounded-2xl bg-muted/10 border-2 border-dashed border-muted text-center">
                                                    <p className="text-sm text-muted-foreground font-bold italic tracking-tight">Clinic closed on {dayConfig.day}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default DoctorDashboard;
