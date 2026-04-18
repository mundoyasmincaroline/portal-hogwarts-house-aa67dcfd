import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import HouseCrest from "./HouseCrest";
import { Input } from "./ui/input";

export default function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [groupedStories, setGroupedStories] = useState<Record<string, any[]>>({});
  const [activeStoryUser, setActiveStoryUser] = useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryImage, setNewStoryImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (storiesData && storiesData.length > 0) {
      const userIds = [...new Set(storiesData.map(s => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, house, id")
        .in("user_id", userIds);
      
      const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      const mergedData = storiesData.map(s => ({
        ...s,
        profiles: profilesMap[s.user_id]
      }));

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
    if (!newStoryContent && !newStoryImage) return;
    if (!user) return;
    setLoading(true);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from("stories").insert([{
      user_id: user.id,
      content: newStoryContent,
      media_url: newStoryImage || null,
      expires_at: expiresAt.toISOString()
    }]);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Story publicado com sucesso! ✨");
      setShowAddModal(false);
      setNewStoryContent("");
      setNewStoryImage("");
      fetchStories();
    }
  };

  const openStory = (userId: string) => {
    setActiveStoryUser(userId);
    setActiveStoryIndex(0);
  };

  const nextStory = () => {
    if (!activeStoryUser) return;
    const userStories = groupedStories[activeStoryUser];
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      // Find next user
      const userIds = Object.keys(groupedStories);
      const currentUserIndex = userIds.indexOf(activeStoryUser);
      if (currentUserIndex < userIds.length - 1) {
        setActiveStoryUser(userIds[currentUserIndex + 1]);
        setActiveStoryIndex(0);
      } else {
        setActiveStoryUser(null);
      }
    }
  };

  const currentActiveStory = activeStoryUser ? groupedStories[activeStoryUser][activeStoryIndex] : null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 mb-4 custom-scrollbar items-center">
        {/* Adicionar Story */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-2xl text-primary">+</span>
          </div>
          <span className="text-xs font-heading text-muted-foreground group-hover:text-primary">Novo Story</span>
        </button>

        {/* Lista de Stories */}
        {Object.entries(groupedStories).map(([userId, userStories]) => {
          const profile = userStories[0].profiles;
          return (
            <button 
              key={userId} 
              onClick={() => openStory(userId)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5 overflow-hidden group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center font-heading text-xl text-primary overflow-hidden relative">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name[0]
                  )}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                    <HouseCrest house={profile.house} size="sm" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-heading text-foreground truncate w-16 text-center">
                {profile.full_name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* View Modal */}
      {currentActiveStory && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={() => setActiveStoryUser(null)}>
          <div className="w-full max-w-md h-[80vh] md:h-[90vh] bg-card/10 relative rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center border border-primary/20 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            {/* Progress Bars */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
              {groupedStories[activeStoryUser].map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <div className={`h-full bg-white transition-all ${idx < activeStoryIndex ? 'w-full' : idx === activeStoryIndex ? 'w-full animate-[progress_5s_linear]' : 'w-0'}`} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-6 left-4 right-4 flex items-center gap-3 z-20">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary overflow-hidden border border-primary">
                {currentActiveStory.profiles.avatar_url ? (
                  <img src={currentActiveStory.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentActiveStory.profiles.full_name[0]
                )}
              </div>
              <div className="text-white drop-shadow-md">
                <p className="font-heading text-sm">{currentActiveStory.profiles.full_name}</p>
                <p className="text-xs opacity-80">{new Date(currentActiveStory.created_at).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Content */}
            <div className="w-full h-full relative flex items-center justify-center" onClick={nextStory}>
              {currentActiveStory.media_url ? (
                <>
                  <img src={currentActiveStory.media_url} alt="Story" className="w-full h-full object-cover" />
                  {currentActiveStory.content && (
                    <div className="absolute bottom-10 left-4 right-4 bg-black/60 p-4 rounded-xl text-white text-sm backdrop-blur-md">
                      {currentActiveStory.content}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary flex items-center justify-center p-8">
                  <p className="text-white text-2xl md:text-3xl font-heading text-center drop-shadow-lg leading-relaxed">
                    {currentActiveStory.content}
                  </p>
                </div>
              )}
            </div>

            <button className="absolute top-6 right-4 text-white z-20 hover:scale-110 transition-transform" onClick={() => setActiveStoryUser(null)}>
              ✖
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass rounded-2xl p-6 relative">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" onClick={() => setShowAddModal(false)}>✖</button>
            <h3 className="font-heading text-xl text-primary mb-4">Novo Story</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">O que está acontecendo?</label>
                <textarea 
                  className="w-full bg-secondary/50 border border-border rounded-lg p-3 text-sm focus:outline-none min-h-[100px]"
                  placeholder="Conte algo mágico..."
                  value={newStoryContent}
                  onChange={e => setNewStoryContent(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-heading text-muted-foreground block mb-1">Link de uma Imagem (Opcional)</label>
                <Input 
                  placeholder="https://..." 
                  value={newStoryImage}
                  onChange={e => setNewStoryImage(e.target.value)}
                />
              </div>

              <Button variant="magical" className="w-full" onClick={handleAddStory} disabled={loading || (!newStoryContent && !newStoryImage)}>
                {loading ? "Postando..." : "Publicar Story"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
