import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const Feed = lazy(() => import("@/pages/Feed"));
const Houses = lazy(() => import("@/pages/Houses"));
const Ranking = lazy(() => import("@/pages/Ranking"));
const Challenges = lazy(() => import("@/pages/Challenges"));
const Events = lazy(() => import("@/pages/Events"));
const Profile = lazy(() => import("@/pages/Profile"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminFinance = lazy(() => import("@/pages/AdminFinance"));
const AdminCharacters = lazy(() => import("@/pages/AdminCharacters"));
const Chats = lazy(() => import("@/pages/Chats"));
const ChatRoom = lazy(() => import("@/pages/ChatRoom"));
const InstaHogwarts = lazy(() => import("@/pages/InstaHogwarts"));
const StickerAlbum = lazy(() => import("@/pages/StickerAlbum"));
const Classes = lazy(() => import("@/pages/Classes"));
const CanonLessons = lazy(() => import("@/pages/CanonLessons"));
const Rules = lazy(() => import("@/pages/Rules"));
const MaraudersGuide = lazy(() => import("@/pages/MaraudersGuide"));
const DMInbox = lazy(() => import("@/pages/DMInbox"));
const DMChat = lazy(() => import("@/pages/DMChat"));
const Friends = lazy(() => import("@/pages/Friends"));
const StickerTrades = lazy(() => import("@/pages/StickerTrades"));
const Azkaban = lazy(() => import("@/pages/Azkaban"));
const Members = lazy(() => import("@/pages/Members"));
const GringottsStore = lazy(() => import("@/pages/GringottsStore"));
const Duels = lazy(() => import("@/pages/Duels"));
const Wallet = lazy(() => import("@/pages/Wallet"));
const BattlePass = lazy(() => import("@/pages/BattlePass"));
const Clubs = lazy(() => import("@/pages/Clubs"));
const RPHistory = lazy(() => import("@/pages/RPHistory"));
const Tournaments = lazy(() => import("@/pages/Tournaments"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const NotificationPreferences = lazy(() => import("@/pages/NotificationPreferences"));
const Quests = lazy(() => import("@/pages/Quests"));
const SortingHatAI = lazy(() => import("@/pages/SortingHatAI"));
const ProphetDaily = lazy(() => import("@/pages/ProphetDaily"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const Guilds = lazy(() => import("@/pages/Guilds"));
const RaidBoss = lazy(() => import("@/pages/RaidBoss"));
const Auctions = lazy(() => import("@/pages/Auctions"));
const Gringotts = lazy(() => import("@/pages/Gringotts"));
const WorldEditor = lazy(() => import("@/pages/WorldEditor"));
const RankedLadder = lazy(() => import("@/pages/RankedLadder"));
const DuelsPvP = lazy(() => import("@/pages/DuelsPvP"));
const Quidditch = lazy(() => import("@/pages/Quidditch"));
const RoomOfRequirement = lazy(() => import("@/pages/RoomOfRequirement"));
const Lounge = lazy(() => import("@/pages/Lounge"));
const WandCrafting = lazy(() => import("@/pages/WandCrafting"));
const Patronus = lazy(() => import("@/pages/Patronus"));
const Chapters = lazy(() => import("@/pages/Chapters"));
const NPCs = lazy(() => import("@/pages/NPCs"));
const NPCChat = lazy(() => import("@/pages/NPCChat"));
const Diary = lazy(() => import("@/pages/Diary"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const Prophecy = lazy(() => import("@/pages/Prophecy"));
const CastleMap = lazy(() => import("@/pages/CastleMap"));
const AdminSupport = lazy(() => import("@/pages/AdminSupport"));
const RPTeams = lazy(() => import("@/pages/RPTeams"));
const RPTeamDetail = lazy(() => import("@/pages/RPTeamDetail"));
const LiveEvents = lazy(() => import("@/pages/LiveEvents"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const Reputation = lazy(() => import("@/pages/Reputation"));
const Hogsmeade = lazy(() => import("@/pages/Hogsmeade"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const ItemTrades = lazy(() => import("@/pages/ItemTrades"));
const Grimoire = lazy(() => import("@/pages/Grimoire"));
const Exams = lazy(() => import("@/pages/Exams"));
const Discipline = lazy(() => import("@/pages/Discipline"));
const DiagonAlley = lazy(() => import("@/pages/DiagonAlley"));
const GringottsVault = lazy(() => import("@/pages/GringottsVault"));
const Ministry = lazy(() => import("@/pages/Ministry"));
const Creatures = lazy(() => import("@/pages/Creatures"));
const Greenhouse = lazy(() => import("@/pages/Greenhouse"));
const PotionsLab = lazy(() => import("@/pages/PotionsLab"));
const WorldMap = lazy(() => import("@/pages/WorldMap"));
const MagicalTravel = lazy(() => import("@/pages/MagicalTravel"));
const TravelJournal = lazy(() => import("@/pages/TravelJournal"));
const TriwizardTournament = lazy(() => import("@/pages/TriwizardTournament"));
const DuelLadder = lazy(() => import("@/pages/DuelLadder"));
const HallOfFame = lazy(() => import("@/pages/HallOfFame"));
const DarkArts = lazy(() => import("@/pages/DarkArts"));
const Factions = lazy(() => import("@/pages/Factions"));
const LegendaryProphecies = lazy(() => import("@/pages/LegendaryProphecies"));
const BattleOfHogwarts = lazy(() => import("@/pages/BattleOfHogwarts"));
const EndTimes = lazy(() => import("@/pages/EndTimes"));
const Lineages = lazy(() => import("@/pages/Lineages"));
const MagicalCalendar = lazy(() => import("@/pages/MagicalCalendar"));

export const DashboardRoutes = (
  <>

                  <Route index element={<Feed />} />
                  <Route path="chats" element={<Chats />} />
                  <Route path="chat/:roomId" element={<ChatRoom />} />
                  <Route path="instahogwarts" element={<InstaHogwarts />} />
                  <Route path="album" element={<StickerAlbum />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="canon-lessons" element={<CanonLessons />} />
                  <Route path="battle-pass" element={<BattlePass />} />
                  <Route path="clubs" element={<Clubs />} />
                  <Route path="clubs/:id" element={<Lounge scope="club" />} />
                  <Route path="houses" element={<Houses />} />
                  <Route path="ranking" element={<Ranking />} />
                  <Route path="challenges" element={<Challenges />} />
                  <Route path="events" element={<Events />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:userId" element={<Profile />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="admin" element={
                    <ProtectedRoute adminOnly>
                      <Admin />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/finance" element={
                    <ProtectedRoute adminOnly>
                      <AdminFinance />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/characters" element={
                    <ProtectedRoute adminOnly>
                      <AdminCharacters />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/support" element={
                    <ProtectedRoute adminOnly>
                      <AdminSupport />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="rules" element={<Rules />} />
                  <Route path="guide" element={<MaraudersGuide />} />
                  <Route path="dm" element={<DMInbox />} />
                  <Route path="dm/:userId" element={<DMChat />} />
                  <Route path="friends" element={<Friends />} />
                  <Route path="trades" element={<StickerTrades />} />
                  <Route path="azkaban" element={<Azkaban />} />
                  <Route path="members" element={<Members />} />
                  <Route path="store" element={<GringottsStore />} />
                  <Route path="duels" element={<Duels />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="rp-history" element={<RPHistory />} />
                  <Route path="tournaments" element={<Tournaments />} />
                  <Route path="marketplace" element={<Marketplace />} />
                  <Route path="settings/notifications" element={<NotificationPreferences />} />
                  <Route path="quests" element={<Quests />} />
                  <Route path="sorting-hat" element={<SortingHatAI />} />
                  <Route path="prophet" element={<ProphetDaily />} />
                  <Route path="guilds" element={<Guilds />} />
                  <Route path="raid" element={<RaidBoss />} />
                  <Route path="auctions" element={<Auctions />} />
                  <Route path="gringotts" element={<Gringotts />} />
                  <Route path="world-editor" element={<WorldEditor />} />
                  <Route path="ranked" element={<RankedLadder />} />
                  <Route path="duels-pvp" element={<DuelsPvP />} />
                  <Route path="quidditch" element={<Quidditch />} />
                  <Route path="room" element={<RoomOfRequirement />} />
                  <Route path="room/:id" element={<Lounge scope="room" />} />
                  <Route path="wand" element={<WandCrafting />} />
                  <Route path="patronus" element={<Patronus />} />
                  <Route path="chapters" element={<Chapters />} />
                  <Route path="npcs" element={<NPCs />} />
                  <Route path="npc/:slug" element={<NPCChat />} />
                  <Route path="diary" element={<Diary />} />
                  <Route path="referrals" element={<Referrals />} />
                  <Route path="prophecy" element={<Prophecy />} />
                  <Route path="castle-map" element={<CastleMap />} />
                  <Route path="rp-teams" element={<RPTeams />} />
                  <Route path="rp-teams/:id" element={<RPTeamDetail />} />
                  <Route path="live-events" element={<LiveEvents />} />
                  <Route path="events/:id" element={<EventDetail />} />
                  <Route path="reputation" element={<Reputation />} />
                  <Route path="hogsmeade" element={<Hogsmeade />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="item-trades" element={<ItemTrades />} />
                  <Route path="grimoire" element={<Grimoire />} />
                  <Route path="exams" element={<Exams />} />
                  <Route path="discipline" element={<Discipline />} />
                  <Route path="diagon" element={<DiagonAlley />} />
                  <Route path="vault" element={<GringottsVault />} />
                  <Route path="ministry" element={<Ministry />} />
                  <Route path="creatures" element={<Creatures />} />
                  <Route path="greenhouse" element={<Greenhouse />} />
                  <Route path="potions" element={<PotionsLab />} />
                  <Route path="world-map" element={<WorldMap />} />
                  <Route path="travel" element={<MagicalTravel />} />
                  <Route path="journal" element={<TravelJournal />} />
                  <Route path="triwizard" element={<TriwizardTournament />} />
                  <Route path="duel-ladder" element={<DuelLadder />} />
                  <Route path="hall-of-fame" element={<HallOfFame />} />
                  <Route path="dark-arts" element={<DarkArts />} />
                  <Route path="factions" element={<Factions />} />
                  <Route path="legendary-prophecies" element={<LegendaryProphecies />} />
                  <Route path="battle-of-hogwarts" element={<BattleOfHogwarts />} />
                  <Route path="end-times" element={<EndTimes />} />
                  <Route path="lineages" element={<Lineages />} />
                  <Route path="calendario-magico" element={<MagicalCalendar />} />
                  <Route path="admin/analytics" element={
                    <ProtectedRoute adminOnly>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } />
                  {/* Wildcard dentro do dashboard: rota inválida → volta ao Salão Principal */}
                  <Route path="*" element={<Feed />} />
                
  </>
);
