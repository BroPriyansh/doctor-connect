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
    ? generateTimeSlots(dayConfig.startTime, dayConfig.endTime, dayConfig.slotDuration)
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
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">MediBook</h1>
              <p className="text-sm text-muted-foreground">Book your appointment</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-online animate-pulse-dot' : 'bg-offline'}`} />
              <span className="text-sm font-medium">
                Doctor is {isOnline ? 'In Clinic' : 'Away'}
              </span>
            </div>
            <Link to="/doctor">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Settings className="w-4 h-4 mr-1" /> Doctor Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 pb-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Book an Appointment
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Select a day and choose an available time slot to schedule your visit.
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
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${isSelected
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : isEnabled
                    ? 'bg-card text-foreground hover:bg-muted border'
                    : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                  } ${isToday && !isSelected ? 'ring-2 ring-primary/30' : ''}`}
              >
                <span className="block">{day.slice(0, 3)}</span>
                {isToday && <span className="text-[10px] opacity-70">Today</span>}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Clock className="w-5 h-5 text-primary" />
              Available Slots — {selectedDay}
            </CardTitle>
            {dayConfig?.enabled && (
              <p className="text-sm text-muted-foreground">
                {formatTime(dayConfig.startTime)} – {formatTime(dayConfig.endTime)} · {dayConfig.slotDuration} min slots
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!dayConfig?.enabled ? (
              <p className="text-muted-foreground text-center py-12">Doctor is not available on {selectedDay}.</p>
            ) : slots.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No slots configured for this day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {slots.map((time) => {
                  const isBooked = bookedTimes.has(time);
                  return (
                    <button
                      key={time}
                      onClick={() => handleSlotClick(time)}
                      disabled={isBooked}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border ${isBooked
                        ? 'bg-booked/10 text-booked border-booked/20 cursor-not-allowed'
                        : 'bg-card text-foreground border-border hover:border-primary hover:bg-primary/5 hover:shadow-md'
                        }`}
                    >
                      {formatTime(time)}
                      {isBooked && <span className="block text-[10px] mt-0.5">Booked</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        {dayAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <CalendarDays className="w-5 h-5 text-primary" />
                Booked Appointments — {selectedDay}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {apt.patientName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{apt.patientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        apt.status === 'approved' ? 'default' :
                          apt.status === 'rejected' ? 'destructive' :
                            apt.status === 'cancelled' ? 'secondary' : 'outline'
                      }>
                        {apt.status}
                      </Badge>
                      <Badge className="bg-primary text-primary-foreground">{formatTime(apt.time)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Manage My Appointments */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Search className="w-5 h-5 text-primary" />
              Manage My Appointments
            </CardTitle>
            <CardDescription>
              Enter your phone number to view and manage your scheduled visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 max-w-sm">
              <Input
                placeholder="10-digit mobile number"
                maxLength={10}
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {searchPhone.length === 10 && (
              <div className="space-y-3 pt-2">
                {myAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No active appointments found for this number.</p>
                ) : (
                  myAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={apt.status === 'approved' ? 'default' : 'outline'}>
                            {apt.status}
                          </Badge>
                          <span className="font-bold">{apt.day}, {apt.date}</span>
                        </div>
                        <p className="text-lg font-display font-medium">{formatTime(apt.time)}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleCancelAppointment(apt.id)}
                      >
                        <Trash2 className="w-4 h-4" /> Cancel
                      </Button>
                    </div>
                  ))
                )}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-100 text-orange-800 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Cancellations are allowed up to 3 hours before the appointment. For later changes, please call the clinic directly.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Book Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-xl p-3 text-center">
              <p className="text-sm text-muted-foreground">Selected Slot</p>
              <p className="text-lg font-bold text-foreground">
                {selectedSlot && formatTime(selectedSlot)} — {selectedDay}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="10-digit mobile number"
                type="tel"
                maxLength={10}
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBookAppointment}
              disabled={!patientName.trim() || patientPhone.length !== 10}
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientBooking;
