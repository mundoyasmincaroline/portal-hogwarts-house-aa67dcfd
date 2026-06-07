import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { GraduationCap, Clock, Award } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
const GRADE_STYLE: Record<string, string> = {
  O: "bg-green-500/30 text-green-400 border-green-500/50",
  E: "bg-blue-500/30 text-blue-400 border-blue-500/50",
  A: "bg-primary/30 text-primary border-primary/50",
  P: "bg-orange-500/30 text-orange-400 border-orange-500/50",
  D: "bg-red-500/30 text-red-400 border-red-500/50",
  T: "bg-red-700/30 text-red-500 border-red-700/50",
};
const GRADE_NAME: Record<string, string> = {
  O: "Ótimo", E: "Excede Expectativas", A: "Aceitável", P: "Péssimo", D: "Desastroso", T: "Trasgo"
};

export default function Exams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState<number>(0);

  const load = async () => {
    const [e, a] = await Promise.all([
      supabase.from("exams").select("*").eq("active", true).order("min_year"),
      user ? supabase.from("exam_attempts").select("*, exam:exams(title,subject,exam_type)").eq("user_id", user.id).order("taken_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ]);
    setExams(e.data ?? []); setAttempts(a.data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    if (!current || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [current?.id]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (current && timer === 0 && questions.length > 0) {
      submit();
    }
  }, [timer]);

  const start = async (exam: any) => {
    const { data } = await supabase.from("exam_questions").select("*").eq("exam_id", exam.id).order("order_idx");
    setCurrent(exam); 
    setQuestions(data ?? []); 
    setAnswers({});
    setTimer(exam.duration_minutes * 60);
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return toast.error("Responda todas as perguntas");
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_exam", { p_exam_id: current.id, p_answers: answers });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const r = data as any;
    if (r.passed) toast.success(`📜 Aprovado! Nota: ${r.grade} (${r.percentage}%)`);
    else toast.error(`Reprovado. Nota: ${r.grade} (${r.percentage}%)`);
    setCurrent(null); load();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-gold-gradient flex items-center gap-2"><GraduationCap/> N.O.M.s & N.I.E.M.s</h1>
        <p className="text-sm text-muted-foreground">Exames oficiais do Ministério da Magia</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-heading text-lg text-gold-gradient mb-3"><EmojiIcon e="📜" /> Exames Disponíveis</h2>
          <div className="space-y-3">
            {exams.map(e => (
              <div key={e.id} className="glass-premium rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <Badge variant="outline" className="text-[9px] mb-1">{e.exam_type}</Badge>
                    <h3 className="font-heading text-sm">{e.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{e.subject}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{e.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Clock size={10}/> {e.duration_minutes}min</span>
                  <span>Aprovação: {e.passing_percentage}%</span>
                  <span className="text-primary">+{e.xp_reward} XP</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => start(e)}>Iniciar Exame</Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg text-gold-gradient mb-3 flex items-center gap-2"><Award size={18}/> Boletim</h2>
          {attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Você ainda não fez exames.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map(a => (
                <div key={a.id} className="glass-premium rounded-xl p-3 flex items-center gap-3">
                  <Badge className={`${GRADE_STYLE[a.grade]} font-heading text-lg w-10 h-10 flex items-center justify-center rounded-full border-2`}>{a.grade}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading truncate">{a.exam?.title}</p>
                    <p className="text-[10px] text-muted-foreground">{GRADE_NAME[a.grade]} · {a.percentage}% · {new Date(a.taken_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {a.passed ? <Badge className="bg-green-500/20 text-green-400 text-[9px]">Aprovado</Badge> : <Badge variant="destructive" className="text-[9px]">Reprovado</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!current} onOpenChange={(o) => !o && setCurrent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{current?.title}</span>
              {timer > 0 && (
                <Badge variant="outline" className={`font-mono transition-all duration-300 ${timer < 60 ? "text-red-500 animate-pulse bg-red-500/10 scale-110" : "text-primary"}`}>
                  <Clock size={12} className="mr-1" />
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </Badge>
              )}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">{current?.subject} · {questions.length} perguntas · Aprovação: {current?.passing_percentage}%</p>
          </DialogHeader>
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="border border-border rounded-lg p-3">
                <p className="font-heading text-sm mb-2">{qi+1}. {q.question}</p>
                <div className="space-y-1">
                  {(q.options as string[]).map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                      className={`w-full text-left text-xs p-2 rounded border transition-all ${
                        answers[q.id] === oi
                          ? "bg-primary/20 border-primary text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {String.fromCharCode(65+oi)}. {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button className="w-full" disabled={submitting} onClick={submit}>
              {submitting ? "Enviando..." : "Entregar Exame"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}