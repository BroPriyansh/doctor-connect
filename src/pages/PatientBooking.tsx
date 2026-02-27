import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  Appointment,
  DayAvailability,
  loadAvailability,
  loadAppointments,
  saveAppointments,
  loadOnlineStatus,
  generateTimeSlots,
  formatTime,
  getTodayDayOfWeek,
  getDateForDay,
  DAYS_OF_WEEK,
  DayOfWeek,
  canCancel,
  isPastTime,
  formatPhoneNumber,
} from "@/lib/appointments";
import { Stethoscope, CalendarDays, Clock, Phone, User, Settings, Search, Trash2, AlertCircle } from "lucide-react";

const PatientBooking = () => {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();

  const selectedDate = getDateForDay(selectedDay);

  // Refresh data periodically
  useEffect(() => {
    const load = () => {
      const allAppts = loadAppointments();
      setAvailability(loadAvailability());
      setAppointments(allAppts);
      setIsOnline(loadOnlineStatus());

      // Update my appointments if searching
      if (searchPhone.length === 10) {
        setMyAppointments(allAppts.filter(a =>
          a.patientPhone === searchPhone &&
          (a.status === 'pending' || a.status === 'approved') &&
          !isPastTime(a.date, a.time)
        ));
      }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [searchPhone]);

  const handleCancelAppointment = (id: string) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt) return;

    const { allowed, message } = canCancel(apt.date, apt.time);

    if (allowed) {
      const updated = appointments.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
      setAppointments(updated);
      saveAppointments(updated);
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully cancelled.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Cannot Cancel",
        description: message,
      });
    }
  };

  const dayConfig = availability.find(a => a.day === selectedDay);
  const slots = dayConfig?.enabled
    ? generateTimeSlots(dayConfig.shifts, dayConfig.slotDuration)
      .filter(time => !isPastTime(selectedDate, time))
    : [];

  const dayAppointments = appointments.filter(a =>
    a.day === selectedDay &&
    a.date === selectedDate &&
    !isPastTime(a.date, a.time) &&
    a.status !== 'rejected' &&
    a.status !== 'cancelled'
  );

  const bookedTimes = new Set(dayAppointments.map(a => a.time));

  const handleSlotClick = (time: string) => {
    if (bookedTimes.has(time)) return;
    setSelectedSlot(time);
    setDialogOpen(true);
  };

  const handleBookAppointment = () => {
    if (!patientName.trim() || !patientPhone.trim() || !selectedSlot) return;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      day: selectedDay,
      date: selectedDate,
      time: selectedSlot,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      status: 'pending',
    };

    const updated = [...appointments, newAppointment];
    setAppointments(updated);
    saveAppointments(updated);
    setDialogOpen(false);
    setPatientName("");
    setPatientPhone("");
    setSelectedSlot(null);
    toast({
      title: "Appointment Requested!",
      description: `Your appointment for ${formatTime(selectedSlot)} on ${selectedDay} is pending doctor approval.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 interactive-card">
              <Stethoscope className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">MediBook</h1>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Premium Clinic Services</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 glass-card rounded-full px-4 py-1.5 border-white/20">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-online animate-pulse-dot shadow-[0_0_10px_rgba(var(--online),0.5)]' : 'bg-offline'}`} />
              <span className="text-xs font-bold tracking-tight">
                DOCTOR IS {isOnline ? 'IN CLINIC' : 'AWAY'}
              </span>
            </div>
            <Link to="/doctor">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary premium-button">
                <Settings className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Doctor Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-3xl -z-10" />
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 px-3 py-1">Healthcare Simplified</Badge>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight">
            Book Your <span className="gradient-text">Wellness</span> Visit
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
            Experience seamless healthcare scheduling with top-tier practitioners.
            Choose your preferred time and get instant confirmation.
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center flex-wrap">
          {DAYS_OF_WEEK.map((day) => {
            const config = availability.find(a => a.day === day);
            const isEnabled = config?.enabled;
            const isSelected = day === selectedDay;
            const isToday = day === getTodayDayOfWeek();
            return (
              <button
                key={day}
                onClick={() => isEnabled && setSelectedDay(day)}
                disabled={!isEnabled}
                className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all interactive-card border-2 ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/25 scale-105'
                  : isEnabled
                    ? 'bg-card text-foreground border-border hover:border-primary/50'
                    : 'bg-muted/30 text-muted-foreground border-transparent cursor-not-allowed opacity-50'
                  } ${isToday && !isSelected ? 'border-primary/20' : ''}`}
              >
                <span className="block">{day.slice(0, 3)}</span>
                {isToday && <span className="text-[10px] opacity-70">Today</span>}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        <Card className="glass-card overflow-hidden border-none ring-1 ring-white/20">
          <CardHeader className="border-b border-white/10 bg-white/5 dark:bg-black/5">
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <Clock className="w-6 h-6 text-primary" />
              Available Time Slots
            </CardTitle>
            {dayConfig?.enabled && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground font-medium">
                <span className="text-foreground font-black">{selectedDay}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {dayConfig.shifts.map((shift, idx) => (
                    <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold px-2 py-0">
                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-8">
            {!dayConfig?.enabled ? (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">Doctor is not accepting appointments on {selectedDay}.</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-medium">All slots fixed for today or fully booked.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((time) => {
                  const isBooked = bookedTimes.has(time);
                  return (
                    <button
                      key={time}
                      onClick={() => handleSlotClick(time)}
                      disabled={isBooked}
                      className={`py-4 px-2 rounded-2xl text-sm font-bold transition-all border-2 interactive-card ${isBooked
                        ? 'bg-booked/10 text-booked border-booked/20 cursor-not-allowed opacity-60'
                        : 'bg-card text-foreground border-border hover:border-primary hover:bg-primary/5 shadow-sm'
                        }`}
                    >
                      <span className="text-base">{formatTime(time)}</span>
                      {isBooked && <span className="block text-[10px] mt-1 uppercase tracking-tight font-black">Booked</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booked Appointments */}
        {dayAppointments.length > 0 && (
          <Card className="border-none ring-1 ring-border shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <CalendarDays className="w-5 h-5 text-primary" />
                Scheduled for {selectedDay}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {dayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-secondary/50 interactive-card">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-inner">
                        {apt.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{apt.patientName}</span>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Verified Patient</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        apt.status === 'approved' ? 'default' :
                          apt.status === 'rejected' ? 'destructive' :
                            apt.status === 'cancelled' ? 'secondary' : 'outline'
                      } className="px-3 rounded-full font-bold uppercase text-[10px]">
                        {apt.status}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 rounded-full font-black">
                        {formatTime(apt.time)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Manage My Appointments */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <Card className="relative border-none ring-1 ring-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden rounded-[1.8rem]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-2xl">
                <Search className="w-6 h-6 text-primary" />
                Manage Appointments
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Access your booking history and manage upcoming visits securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    value={searchPhone}
                    className="pl-10 h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                    onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {searchPhone.length === 10 && (
                <div className="space-y-4 pt-4 border-t border-dashed border-border">
                  {myAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-2xl">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium italic">No active appointments found for this number.</p>
                    </div>
                  ) : (
                    myAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-white dark:bg-black/20 border-2 border-primary/5 shadow-sm interactive-card gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex flex-col items-center justify-center border border-primary/10">
                            <span className="text-[10px] font-black uppercase text-primary leading-none">{apt.day.slice(0, 3)}</span>
                            <span className="text-lg font-black text-primary leading-none">{apt.date.split('-')[2]}</span>
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge variant={apt.status === 'approved' ? 'default' : 'outline'} className="text-[10px] h-5 rounded-full font-black uppercase">
                                {apt.status}
                              </Badge>
                              <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full">ID: {apt.id.slice(0, 8)}</span>
                            </div>
                            <p className="text-xl font-display font-black tracking-tight">{formatTime(apt.time)}</p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto gap-2 rounded-xl font-bold premium-button h-10 px-6 shadow-lg shadow-destructive/20"
                          onClick={() => handleCancelAppointment(apt.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Cancel Booking
                        </Button>
                      </div>
                    ))
                  )}
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium leading-relaxed">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Cancellation Policy: Appointments can be cancelled up to 3 hours before the scheduled time. For urgent changes, please contact the support desk.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none ring-1 ring-border shadow-2xl glass animate-in fade-in zoom-in duration-300">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-black gradient-text text-center">Confirm Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="bg-primary/5 rounded-[1.5rem] p-5 text-center border border-primary/10 shadow-inner">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-1">Schedule Details</p>
              <p className="text-xl font-black text-foreground">
                {selectedSlot && formatTime(selectedSlot)} <span className="text-primary mx-1">•</span> {selectedDay}
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">
                  <User className="w-3.5 h-3.5 text-primary" /> Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20 font-medium"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="Enter mobile number"
                  type="tel"
                  maxLength={10}
                  className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20 font-medium font-mono"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold px-6 h-12">Discard</Button>
            <Button
              className="rounded-xl font-black px-8 h-12 premium-button bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 flex-1"
              onClick={handleBookAppointment}
              disabled={!patientName.trim() || patientPhone.length !== 10}
            >
              Verify & Book Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientBooking;
