
// Safety Fallbacks for legacy code references
if (typeof window !== 'undefined') {
  const safety = (window as any);
  
  if (!safety.referrals) safety.referrals = [];
  if (!safety.setReferrals) safety.setReferrals = () => { 
    console.warn("Legacy setReferrals call prevented."); 
  };
  
  // Prevent crash from other potential missing variables mentioned in logs
  if (!safety.user_streaks) safety.user_streaks = [];
  
  console.log("🛡️ Hogwarts Safety Fallbacks Active");
}

export {};
