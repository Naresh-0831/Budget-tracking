import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    TrendingUp, TrendingDown, Minus, AlertTriangle, Brain,
    Lightbulb, DollarSign, Tag, ChevronRight, Loader2,
    CheckCircle2, BarChart3,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n ?? 0);

const CATEGORY_COLORS = {
    Food: '#f97316',
    Rent: '#6366f1',
    Travel: '#06b6d4',
    Shopping: '#a855f7',
    Bills: '#eab308',
    Others: '#94a3b8',
};

const TrendIcon = ({ trend }) => {
    if (trend === 'increasing') return <TrendingUp size={14} className="text-red-400" />;
    if (trend === 'decreasing') return <TrendingDown size={14} className="text-emerald-400" />;
    return <Minus size={14} className="text-slate-400" />;
};

// ─── Section wrapper card ─────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`glass rounded-2xl p-5 card-hover ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, title, subtitle, color = '#6366f1' }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div>
                <h3 className="text-white font-semibold text-base leading-tight">{title}</h3>
                {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ─── 1. Expense Prediction ────────────────────────────────────────────────────
function PredictionCard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/ml/predict-expense')
            .then(r => setData(r.data.prediction))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Card>
            <SectionHeader
                icon={TrendingUp}
                title="Expense Prediction"
                subtitle="Next month forecast using linear regression"
                color="#6366f1"
            />
            {loading ? (
                <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto my-6" />
            ) : !data || data.predictedAmount === 0 ? (
                <div className="text-center py-6">
                    <Brain size={36} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{data?.message || 'No prediction available yet.'}</p>
                    <p className="text-slate-500 text-xs mt-1">Add at least 2 months of expenses to enable prediction.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-end gap-4 mb-5">
                        <div>
                            <p className="text-slate-400 text-xs mb-1">Predicted Next Month</p>
                            <p className="text-4xl font-bold text-white">{fmt(data.predictedAmount)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg"
                            style={{
                                background: data.trend === 'increasing' ? '#ef444420' : data.trend === 'decreasing' ? '#22c55e20' : '#94a3b820',
                                border: `1px solid ${data.trend === 'increasing' ? '#ef444440' : data.trend === 'decreasing' ? '#22c55e40' : '#94a3b840'}`,
                            }}>
                            <TrendIcon trend={data.trend} />
                            <span className="text-xs font-medium capitalize"
                                style={{ color: data.trend === 'increasing' ? '#f87171' : data.trend === 'decreasing' ? '#4ade80' : '#94a3b8' }}>
                                {data.trend}
                            </span>
                        </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-400">Model Confidence</span>
                            <span className="text-white font-semibold">{data.confidence}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${data.confidence}%`,
                                    background: data.confidence >= 70 ? 'linear-gradient(90deg,#22c55e,#4ade80)' :
                                        data.confidence >= 40 ? 'linear-gradient(90deg,#eab308,#fbbf24)' :
                                            'linear-gradient(90deg,#ef4444,#f87171)',
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs">{data.message}</p>
                </>
            )}
        </Card>
    );
}

// ─── 2. Category Suggester ────────────────────────────────────────────────────
function CategorySuggester() {
    const [title, setTitle] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const suggest = useCallback(async () => {
        if (!title.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const r = await api.post('/ml/suggest-category', { title });
            setResult(r.data.suggestedCategory);
        } catch {
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [title]);

    const color = CATEGORY_COLORS[result] || '#94a3b8';

    return (
        <Card>
            <SectionHeader
                icon={Tag}
                title="Smart Category Suggester"
                subtitle="AI suggests a category from your expense title"
                color="#a855f7"
            />
            <div className="flex gap-2">
                <input
                    value={title}
                    onChange={e => { setTitle(e.target.value); setResult(null); }}
                    onKeyDown={e => e.key === 'Enter' && suggest()}
                    placeholder='e.g. "Dominos Pizza" or "Netflix"'
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                />
                <button
                    onClick={suggest}
                    disabled={!title.trim() || loading}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Suggest'}
                </button>
            </div>
            {result && (
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}30` }}>
                        <CheckCircle2 size={16} style={{ color }} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Suggested Category</p>
                        <p className="font-semibold text-white">{result}</p>
                    </div>
                    <div className="ml-auto px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${color}25`, color }}>
                        {result}
                    </div>
                </div>
            )}
        </Card>
    );
}

// ─── 3. Anomaly Detection ─────────────────────────────────────────────────────
function AnomalyList() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/ml/anomalies')
            .then(r => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Card>
            <SectionHeader
                icon={AlertTriangle}
                title="Anomaly Detection"
                subtitle="Expenses that are unusually high (> 2× your category average)"
                color="#f97316"
            />
            {loading ? (
                <Loader2 size={24} className="animate-spin text-orange-400 mx-auto my-6" />
            ) : !data ? (
                <p className="text-slate-400 text-sm text-center py-4">Failed to load anomaly data.</p>
            ) : data.anomalies.length === 0 ? (
                <div className="text-center py-6">
                    <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-emerald-400 font-medium text-sm">No anomalies detected</p>
                    <p className="text-slate-500 text-xs mt-1">Your spending patterns look healthy!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-orange-400 text-xs font-medium mb-3">{data.message}</p>
                    {data.anomalies.map(exp => {
                        const color = CATEGORY_COLORS[exp.category] || '#94a3b8';
                        return (
                            <div key={exp._id}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: '#f9741610', border: '1px solid #f9741630' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${color}25` }}>
                                    <AlertTriangle size={16} style={{ color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{exp.title}</p>
                                    <p className="text-slate-400 text-xs">
                                        {exp.category} · Avg: {fmt(exp.categoryAvg)} · <span className="text-orange-400">{exp.ratio}× above avg</span>
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-white font-bold text-sm">{fmt(exp.amount)}</p>
                                    <p className="text-slate-500 text-xs">{new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

// ─── 4. Budget Recommendations ────────────────────────────────────────────────
function BudgetRecommendations() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/ml/budget-recommendations')
            .then(r => setData(r.data.recommendations))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Card>
            <SectionHeader
                icon={Lightbulb}
                title="Budget Recommendations"
                subtitle="AI-suggested monthly limits based on your last 3 months"
                color="#eab308"
            />
            {loading ? (
                <Loader2 size={24} className="animate-spin text-yellow-400 mx-auto my-6" />
            ) : !data ? (
                <p className="text-slate-400 text-sm text-center py-4">Failed to load recommendations.</p>
            ) : data.length === 0 ? (
                <div className="text-center py-6">
                    <BarChart3 size={36} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No spending data for the last 3 months.</p>
                    <p className="text-slate-500 text-xs mt-1">Start adding expenses to get personalized recommendations.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map(rec => {
                        const color = CATEGORY_COLORS[rec.category] || '#94a3b8';
                        const pct = Math.min(100, Math.round((rec.avgMonthlySpend / rec.recommendedBudget) * 100));
                        return (
                            <div key={rec.category}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                        <span className="text-slate-200 text-sm font-medium">{rec.category}</span>
                                        <TrendIcon trend={rec.trend} />
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white font-bold text-sm">{fmt(rec.recommendedBudget)}</span>
                                        <span className="text-slate-500 text-xs"> / mo</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span className="text-slate-400 text-xs w-28 text-right">
                                        avg {fmt(rec.avgMonthlySpend)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-slate-500 text-xs pt-2 border-t border-white/5">
                        Recommendations include a 10% buffer above your average monthly spending.
                    </p>
                </div>
            )}
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIInsights() {
    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 20px #6366f150' }}>
                    <Brain size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">AI Insights</h2>
                    <p className="text-slate-400 text-sm">Machine learning–powered financial intelligence</p>
                </div>
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { label: 'Expense Prediction', color: '#6366f1' },
                    { label: 'Category Suggester', color: '#a855f7' },
                    { label: 'Anomaly Detection', color: '#f97316' },
                    { label: 'Budget Recommendations', color: '#eab308' },
                ].map(({ label, color }) => (
                    <span key={label} className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                        <ChevronRight size={10} className="inline mr-1" />
                        {label}
                    </span>
                ))}
            </div>

            {/* Top row: Prediction + Suggester */}
            <div className="grid lg:grid-cols-2 gap-5">
                <PredictionCard />
                <CategorySuggester />
            </div>

            {/* Bottom row: Anomalies + Budget Recommendations */}
            <div className="grid lg:grid-cols-2 gap-5">
                <AnomalyList />
                <BudgetRecommendations />
            </div>

            {/* Footer note */}
            <div className="glass rounded-xl p-4 flex items-start gap-3">
                <DollarSign size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                    All ML calculations happen server-side using your personal expense history.
                    Predictions use linear regression; no data is shared externally.
                    For best results, maintain at least 2–3 months of expense records.
                </p>
            </div>
        </div>
    );
}
