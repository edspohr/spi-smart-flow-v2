import { useState, useEffect } from "react";
import useDataStore from "@/store/useDataStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Building2 } from "lucide-react";
import { collection, query, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClientUser {
    id: string;
    displayName: string;
    email: string;
    role: "spi-admin" | "client" | "guest";
    companyId: string;
    phone?: string;
    altContactName?: string;
    altContactEmail?: string;
    altContactPhone?: string;
}

const ClientList = () => {
    const { companies, subscribeToCompanies } = useDataStore();
    const [users, setUsers] = useState<ClientUser[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => {
        const unsubscribeUsers = onSnapshot(query(collection(db, "users")), (snapshot) => {
            const userList: ClientUser[] = [];
            snapshot.forEach((doc) => {
                userList.push({ id: doc.id, ...doc.data() } as ClientUser);
            });
            setUsers(userList);
            setLoading(false);
        });

        const unsubscribeCompanies = subscribeToCompanies();

        return () => {
            unsubscribeUsers();
            unsubscribeCompanies();
        };
    }, [subscribeToCompanies]);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await updateDoc(doc(db, "users", editingUser.id), {
                role: editingUser.role,
                companyId: editingUser.companyId,
                phone: editingUser.phone || "",
                altContactName: editingUser.altContactName || "",
                altContactEmail: editingUser.altContactEmail || "",
                altContactPhone: editingUser.altContactPhone || ""
            });
            setEditOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.companyId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'spi-admin': return <Badge className="bg-slate-900 text-white border-none text-[8px] font-black uppercase tracking-widest px-2">SPI Admin</Badge>;
            case 'client': return <Badge className="bg-blue-100 text-blue-700 border-none text-[8px] font-black uppercase tracking-widest px-2">Cliente Activo</Badge>;
            case 'guest': return <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest px-2 animate-pulse">Pendiente Aprob.</Badge>;
            default: return <Badge className="bg-slate-50 text-slate-300 border-none text-[8px] font-black uppercase tracking-widest px-2">Desconocido</Badge>;
        }
    };

    // Sort users so guests (pending) are at the top
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (a.role === 'guest' && b.role !== 'guest') return -1;
        if (a.role !== 'guest' && b.role === 'guest') return 1;
        return a.displayName?.localeCompare(b.displayName || '') || 0;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 backdrop-blur-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por nombre, email o empresa..." 
                        className="pl-12 h-11 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 transition-all font-bold text-xs" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white h-11 rounded-2xl px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 transition-all active:scale-95">
                    <Plus className="mr-3 h-4 w-4 stroke-[3]" /> Registrar Usuario
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/40 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-b border-slate-100">
                                <TableHead className="px-8 font-black uppercase text-[10px] text-slate-400 tracking-widest h-14">Usuario / Empresa</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest h-14">Acceso / Rol</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-slate-400 tracking-widest h-14 text-center">Gestión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Usuarios...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20 text-slate-400 font-bold">No se encontraron resultados.</TableCell>
                                </TableRow>
                            ) : (
                                sortedUsers.map((u, idx) => (
                                    <TableRow key={u.id} className={cn("hover:bg-slate-50/50 transition-colors border-b border-slate-50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/20", u.role === 'guest' && "bg-amber-50/10 hover:bg-amber-50/30")}>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-11 w-11 rounded-2xl border-none shadow-lg">
                                                    <AvatarFallback className={cn("font-black text-sm text-white", u.role === 'guest' ? "bg-amber-500" : "bg-blue-600")}>
                                                        {u.displayName?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-black text-slate-800 tracking-tight text-sm flex items-center gap-2">
                                                        {u.displayName || 'Sin Nombre'}
                                                        {u.role === 'guest' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                                                    </div>
                                                    <div className={cn("text-[10px] font-bold flex items-center gap-1.5 mt-0.5", !u.companyId ? "text-rose-500" : "text-slate-400")}>
                                                        <Building2 className="h-3 w-3" /> {companies.find(c => c.id === u.companyId)?.name || u.companyId || '⚠ Empresa No Asignada'}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-blue-500 mt-1">{u.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                {getRoleBadge(u.role)}
                                                {u.phone && <p className="text-[10px] font-mono font-bold text-slate-400">{u.phone}</p>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center px-8">
                                            <Button 
                                                variant={u.role === 'guest' ? 'default' : 'ghost'} 
                                                size="sm" 
                                                className={cn(
                                                    "font-black uppercase text-[10px] tracking-widest px-4 rounded-xl",
                                                    u.role === 'guest' 
                                                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20" 
                                                        : "bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                )}
                                                onClick={() => {
                                                    setEditingUser({...u}); // Copy to avoid mutating state directly before save
                                                    setEditOpen(true);
                                                }}
                                            >
                                                {u.role === 'guest' ? 'Aprobar & Asignar' : 'Configurar'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-slate-900 text-white">
                        <DialogTitle className="text-2xl font-black tracking-tight">Perfil de Acceso</DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            Privilegios y Vinculación Corporativa
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingUser && (
                        <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rol de Usuario</Label>
                                    <select 
                                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-xs"
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({...editingUser, role: e.target.value as "guest" | "client" | "spi-admin"})}
                                    >
                                        <option value="guest">Invitado (Pendiente Aprobación)</option>
                                        <option value="client">Cliente Activo (Dashboard Operativo)</option>
                                        <option value="spi-admin">SPI Admin (Control Total)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Empresa Vinculada</Label>
                                    <select 
                                        className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-xs"
                                        value={editingUser.companyId || ''}
                                        onChange={e => setEditingUser({...editingUser, companyId: e.target.value})}
                                    >
                                        <option value="">Seleccionar Empresa...</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Teléfono (Whatsapp)</Label>
                                    <Input 
                                        className="h-11 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-xs"
                                        value={editingUser.phone || ''}
                                        onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                                        placeholder="+56 9..."
                                    />
                                </div>
                             </div>
                             
                             <Separator className="bg-slate-100" />
                             
                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">Escalamiento (Opcional)</h4>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-slate-400">Nombre Alternativo</Label>
                                    <Input 
                                        className="h-10 rounded-xl border border-slate-100"
                                        value={editingUser.altContactName || ''}
                                        onChange={e => setEditingUser({...editingUser, altContactName: e.target.value})}
                                    />
                                </div>
                             </div>

                             <DialogFooter className="pt-2">
                                <Button type="button" variant="ghost" className="font-black uppercase text-[10px] text-slate-400" onClick={() => setEditOpen(false)}>Cerrar</Button>
                                <Button type="submit" className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-8 rounded-2xl h-11">Guardar</Button>
                             </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClientList;
