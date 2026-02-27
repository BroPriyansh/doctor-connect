import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Lock, User } from "lucide-react";

export const IS_LOGGED_IN_KEY = "doc_is_logged_in";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "Hero" && password === "1234") {
            localStorage.setItem(IS_LOGGED_IN_KEY, "true");
            toast({
                title: "Login Successful",
                description: "Welcome back, Doctor.",
            });
            navigate("/doctor");
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid username or password.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.15),transparent)] pointer-events-none" />

            <Card className="glass-card w-full max-w-md border-none ring-1 ring-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-700">
                <CardHeader className="text-center pt-10 pb-6">
                    <div className="mx-auto w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-xl shadow-primary/20 interactive-card">
                        <Stethoscope className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-4xl font-display font-black gradient-text tracking-tighter">Welcome back</CardTitle>
                    <CardDescription className="text-sm font-medium mt-2">Authorized practice access only</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="username"
                                    placeholder="Enter username"
                                    className="pl-11 h-13 rounded-2xl border-2 focus-visible:ring-primary/20 bg-background/50 font-medium"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Passkey</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-11 h-13 rounded-2xl border-2 focus-visible:ring-primary/20 bg-background/50 font-mono"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="pt-2 flex flex-col gap-3">
                            <Button type="submit" className="h-13 rounded-2xl font-black text-base premium-button shadow-lg shadow-primary/20">
                                Authenticate
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-12 rounded-xl text-muted-foreground font-bold hover:bg-muted/50"
                                onClick={() => navigate("/")}
                            >
                                Cancel & Exit
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
