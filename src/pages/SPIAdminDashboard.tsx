import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { Badge } from '@/components/ui/badge'; // unused

const data = [
  { name: 'Lun', manual: 40, ia: 24 },
  { name: 'Mar', manual: 30, ia: 13 },
  { name: 'Mie', manual: 20, ia: 58 },
  { name: 'Jue', manual: 27, ia: 39 },
  { name: 'Vie', manual: 18, ia: 48 },
  { name: 'Sab', manual: 23, ia: 38 },
  { name: 'Dom', manual: 34, ia: 43 },
];

const SPIAdminDashboard = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800">Torre de Control (SPI Admin)</h1>
            
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass-card col-span-2">
                    <CardHeader>
                        <CardTitle>Eficiencia de Validación</CardTitle>
                        <CardDescription>Comparativa de tiempo: Validación Manual vs IA (Gemini)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="manual" stroke="#94a3b8" fillOpacity={1} fill="url(#colorManual)" name="Manual (min)" />
                                    <Area type="monotone" dataKey="ia" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIa)" name="IA (min)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

             <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-400">Kanban de seguimiento de OTs globales en construcción...</p>
            </div>
        </div>
    );
};

export default SPIAdminDashboard;
