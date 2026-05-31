import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HouseCrest from "@/components/rpg/HouseCrest";
import { Input } from "./ui/input";
import SafeImage from "./SafeImage";
import { Eye } from "lucide-react";

export default function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [groupedStories, setGroupedStories] = useState<Record<string, any[]>>({});
  const [activeStoryUser, setActiveStoryUser] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyViewers, setStoryViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryImage, setNewStoryImage] = useState("");
  const [newStoryFile, setNewStoryFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-advance timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  // Auto-advance after 5 seconds
  useEffect(() => {
    if (!activeStoryUser) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => nextStory(), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeStoryUser, activeStoryIndex]);

  // Register view when opening a story
  useEffect(() => {
    if (!activeStoryUser || !user) return;
    const story = groupedStories[activeStoryUser]?.[activeStoryIndex];
    if (!story) return;

    // Record view (silently)
    supabase.from("story_views").insert({ story_id: story.id, viewer_id: user.id } as never)
      .then(() => {});

    // If it's my own story, load viewers
    if (story.user_id === user.id) {
      loadViewers(story.id);
    } else {
      setStoryViewers([]);
      setShowViewers(false);
    }
  }, [activeStoryUser, activeStoryIndex]);

  const loadViewers = async (storyId: string) => {
    const { data: views } = await supabase
      .from("story_views")
      .select("viewer_id, viewed_at")
      .eq("story_id", storyId)
      .order("viewed_at", { ascending: false });

    if (!views || views.length === 0) { setStoryViewers([]); return; }

    const ids = views.map(v => v.viewer_id);
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
    const enriched = views.map(v => ({
      ...v,
      profile: profs?.find(p => p.user_id === v.viewer_id),
    }));
    setStoryViewers(enriched);
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (storiesData && storiesData.length > 0) {
      const userIds = [...new Set(storiesData.map((s: any) => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, house")
        .in("user_id", userIds);

      const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p; return acc;
      }, {});

      const mergedData = storiesData.map((s: any) => ({ ...s, profiles: profilesMap[s.user_id] }));
      setStories(mergedData);

      const grouped = mergedData.reduce((acc: any, story: any) => {
        const uid = story.user_id;
        if (!acc[uid]) acc[uid] = [];
        acc[uid].push(story);
        return acc;
      }, {});
      setGroupedStories(grouped);
    } else {
      setStories([]);
      setGroupedStories({});
    }
  };

  const handleAddStory = async () => {
    if (!newStoryContent && !newStoryImage && !newStoryFile) return;
    if (!user) return;
    setLoading(true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    let mediaUrl = newStoryImage || null;

    // Upload file if selected
    if (newStoryFile) {
      const ext = newStoryFile.name.split(".").pop();
      const path = `${user.id}/stories/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, newStoryFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        mediaUrl = `${publicUrl}?t=${Date.now()}`;
      }
    }

    const { error } = await supabase.from("stories").insert([{
      user_id: user.id,
      content: newStoryContent,
      media_url: mediaUrl,
      expires_at: expiresAt.toISOString()
    }]);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Story publicado! ✨");
      setShowAddModal(false);
      setNewStoryContent("");
      setNewStoryImage("");
      setNewStoryFile(null);
      fetchStories();
    }
  };

  const openStory = (userId: string) => {
    setActiveStoryUser(userId);
    setActiveStoryIndex(0);
    setShowViewers(false);
  };

  const nextStory = () => {
    if (!activeStoryUser) return;
    const userStories = groupedStories[activeStoryUser];
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      const userIds = Object.keys(groupedStories);
      const currentIdx = userIds.indexOf(activeStoryUser);
      if (currentIdx < userIds.length - 1) {
        setActiveStoryUser(userIds[currentIdx + 1]);
        setActiveStoryIndex(0);
      } else {
        setActiveStoryUser(null);
      }
    }
  };

  const prevStory = () => {
    if (!activeStoryUser) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    }
  };

  const currentActiveStory = activeStoryUser ? groupedStories[activeStoryUser]?.[activeStoryIndex] : null;
  const isMyStory = currentActiveStory?.user_id === user?.id;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-6 mb-6 custom-scrollbar items-center scroll-smooth pr-10">
        {/* Adicionar Story */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center gap-2 sm:gap-3 shrink-0 group relative"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-secondary/30 border-2 border-dashed border-primary/40 flex items-center justify-center transition-all duration-500 group-hover:border-primary group-hover:scale-105 active:scale-95 group-hover:rotate-3 shadow-lg group-hover:shadow-primary/20">
            <span className="text-2xl sm:text-3xl text-primary font-light">+</span>
          </div>
          <span className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">Seu Story</span>
        </button>

        {/* Lista de Stories */}
        {Object.entries(groupedStories).map(([userId, userStories]) => {
          const prof = userStories[0].profiles;
          const isMe = userId === user?.id;
          return (
            <button
              key={userId}
              onClick={() => openStory(userId)}
              className="flex flex-col items-center gap-2 sm:gap-3 shrink-0 group relative"
            >
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-0.5 sm:p-1 transition-all duration-500 group-hover:scale-110 active:scale-95 group-hover:-rotate-3 shadow-xl ${isMe ? "bg-gradient-to-tr from-primary/20 to-transparent border border-dashed border-primary/50" : "bg-gradient-to-tr from-primary via-primary/40 to-primary border-2 border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]"}`}>
                <div className="w-full h-full rounded-xl sm:rounded-[1.25rem] bg-card overflow-hidden relative border border-black/20">
                  <SafeImage
                    src={prof?.avatar_url}
                    alt={prof?.full_name || ""}
                    fallbackText={prof?.full_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-card rounded-tl-xl flex items-center justify-center border-t border-l border-white/10 shadow-lg">
                    <HouseCrest house={prof?.house} size="xs" />
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-heading truncate w-20 text-center uppercase tracking-widest transition-colors ${isMe ? "text-primary font-bold" : "text-foreground group-hover:text-primary"}`}>
                {isMe ? "Você" : (prof?.full_name?.split(" ")[0] || "?")}
              </span>
            </button>
          );
        })}
      </div>


      {/* Story Viewer */}
      {currentActiveStory && (
        <div className="fixed inset-0 z-[60] bg-black/95 sm:bg-black/80 sm:backdrop-blur-xl flex items-center justify-center p-0 sm:p-4" onClick={() => setActiveStoryUser(null)}>
          <div
            className="w-full max-w-md h-full sm:h-[85vh] sm:max-h-[800px] relative sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col bg-card border-none sm:border sm:border-white/10"
            onClick={e => e.stopPropagation()}
          >

            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {groupedStories[activeStoryUser!].map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div className={`h-full bg-white ${idx < activeStoryIndex ? "w-full" : idx === activeStoryIndex ? "w-full animate-[progress_5s_linear]" : "w-0"}`} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-4 right-4 flex items-center gap-3 z-20">
              <SafeImage
                src={currentActiveStory.profiles?.avatar_url}
                alt={currentActiveStory.profiles?.full_name || ""}
                fallbackText={currentActiveStory.profiles?.full_name}
                className="w-10 h-10 rounded-full object-cover border border-primary"
              />
              <div className="text-white drop-shadow-md flex-1 min-w-0">
                <p className="font-heading text-sm">{currentActiveStory.profiles?.full_name}</p>
                <p className="text-xs opacity-75">{new Date(currentActiveStory.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <button className="text-white hover:scale-110 transition-transform text-lg" onClick={() => setActiveStoryUser(null)}>✖</button>
            </div>

            {/* Tap zones */}
            <div className="absolute inset-0 z-10 flex">
              <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
              <div className="w-1/3 h-full" />
              <div className="w-1/3 h-full cursor-pointer" onClick={nextStory} />
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center">
              {currentActiveStory.media_url ? (
                <>
                  <img src={currentActiveStory.media_url} alt="Story" className="w-full h-full object-cover" />
                  {currentActiveStory.content && (
                    <div className="absolute bottom-16 left-4 right-4 bg-black/60 p-4 rounded-xl text-white text-sm backdrop-blur-md z-20">
                      {currentActiveStory.content}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 via-background/50 to-secondary flex items-center justify-center p-8">
                  <p className="text-white text-2xl font-heading text-center drop-shadow-lg leading-relaxed">
                    {currentActiveStory.content}
                  </p>
                </div>
              )}
            </div>

            {/* Viewers (meus stories) */}
            {isMyStory && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <button
                  onClick={() => setShowViewers(v => !v)}
                  className="flex items-center gap-2 text-white/80 text-xs hover:text-white transition-colors"
                >
                  <Eye size={14} />
                  {storyViewers.length} visualizações
                </button>
                {showViewers && storyViewers.length > 0 && (
                  <div className="mt-2 bg-black/80 backdrop-blur-md rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                    {storyViewers.map(v => (
                      <div key={v.viewer_id} className="flex items-center gap-2">
                        <SafeImage
                          src={v.profile?.avatar_url}
                          alt={v.profile?.full_name || ""}
                          fallbackText={v.profile?.full_name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white text-xs font-heading">{v.profile?.full_name || "Bruxo"}</p>
                          <p className="text-white/50 text-[10px]">{new Date(v.viewed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass rounded-2xl p-6 relative">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setShowAddModal(false)}>✖</button>
            <h3 className="font-heading text-xl text-primary mb-4">Novo Story</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">O que está acontecendo?</label>
                <textarea
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm focus:outline-none min-h-[100px] resize-none"
                  placeholder="Conte algo mágico..."
                  value={newStoryContent}
                  onChange={e => setNewStoryContent(e.target.value)}
                />
              </div>

              {/* Image upload or URL */}
              {newStoryFile ? (
                <div className="relative inline-block w-full">
                  <img src={URL.createObjectURL(newStoryFile)} className="w-full h-32 object-cover rounded-xl border border-border" />
                  <button className="absolute top-2 right-2 bg-destructive text-white rounded-full w-6 h-6 text-xs flex items-center justify-center" onClick={() => setNewStoryFile(null)}>✕</button>
                </div>
              ) : (
                <>
                  <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-sm text-primary font-heading">
                    📷 Fazer upload de foto
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { setNewStoryFile(e.target.files?.[0] || null); setNewStoryImage(""); }} />
                  </label>
                  <p className="text-[11px] text-muted-foreground text-center">— ou cole um link abaixo —</p>
                  <Input
                    placeholder="https://link-da-imagem.com"
                    value={newStoryImage}
                    onChange={e => { setNewStoryImage(e.target.value); setNewStoryFile(null); }}
                  />
                </>
              )}

              <Button variant="magical" className="w-full" onClick={handleAddStory} disabled={loading || (!newStoryContent && !newStoryImage && !newStoryFile)}>
                {loading ? "Postando..." : "Publicar Story ✨"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
