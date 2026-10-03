/* Nom du cache et liste ASSETS réécrits par scripts/build.mjs à chaque déploiement. */
const C='repere-dev';
const ASSETS=["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./img/Alternate_Hammer_Curl_0.jpg", "./img/Alternate_Hammer_Curl_1.jpg", "./img/Arnold_Dumbbell_Press_0.jpg", "./img/Arnold_Dumbbell_Press_1.jpg", "./img/Barbell_Bench_Press_-_Medium_Grip_0.jpg", "./img/Barbell_Bench_Press_-_Medium_Grip_1.jpg", "./img/Barbell_Curl_0.jpg", "./img/Barbell_Curl_1.jpg", "./img/Barbell_Deadlift_0.jpg", "./img/Barbell_Deadlift_1.jpg", "./img/Barbell_Hip_Thrust_0.jpg", "./img/Barbell_Hip_Thrust_1.jpg", "./img/Barbell_Incline_Bench_Press_-_Medium_Grip_0.jpg", "./img/Barbell_Incline_Bench_Press_-_Medium_Grip_1.jpg", "./img/Barbell_Lunge_0.jpg", "./img/Barbell_Lunge_1.jpg", "./img/Barbell_Shrug_0.jpg", "./img/Barbell_Shrug_1.jpg", "./img/Barbell_Squat_0.jpg", "./img/Barbell_Squat_1.jpg", "./img/Bench_Dips_0.jpg", "./img/Bench_Dips_1.jpg", "./img/Bent_Over_Barbell_Row_0.jpg", "./img/Bent_Over_Barbell_Row_1.jpg", "./img/Bent_Over_Two-Dumbbell_Row_0.jpg", "./img/Bent_Over_Two-Dumbbell_Row_1.jpg", "./img/Cable_Crossover_0.jpg", "./img/Cable_Crossover_1.jpg", "./img/Cable_Crunch_0.jpg", "./img/Cable_Crunch_1.jpg", "./img/Cable_Rope_Overhead_Triceps_Extension_0.jpg", "./img/Cable_Rope_Overhead_Triceps_Extension_1.jpg", "./img/Cat_Stretch_0.jpg", "./img/Cat_Stretch_1.jpg", "./img/Childs_Pose_0.jpg", "./img/Childs_Pose_1.jpg", "./img/Chin-Up_0.jpg", "./img/Chin-Up_1.jpg", "./img/Crunches_0.jpg", "./img/Crunches_1.jpg", "./img/Dips_-_Chest_Version_0.jpg", "./img/Dips_-_Chest_Version_1.jpg", "./img/Dips_-_Triceps_Version_0.jpg", "./img/Dips_-_Triceps_Version_1.jpg", "./img/Dumbbell_Bench_Press_0.jpg", "./img/Dumbbell_Bench_Press_1.jpg", "./img/Dumbbell_Lunges_0.jpg", "./img/Dumbbell_Lunges_1.jpg", "./img/Dumbbell_Shoulder_Press_0.jpg", "./img/Dumbbell_Shoulder_Press_1.jpg", "./img/Dumbbell_Shrug_0.jpg", "./img/Dumbbell_Shrug_1.jpg", "./img/External_Rotation_0.jpg", "./img/External_Rotation_1.jpg", "./img/Face_Pull_0.jpg", "./img/Face_Pull_1.jpg", "./img/Farmers_Walk_0.jpg", "./img/Farmers_Walk_1.jpg", "./img/Front_Barbell_Squat_0.jpg", "./img/Front_Barbell_Squat_1.jpg", "./img/Front_Dumbbell_Raise_0.jpg", "./img/Front_Dumbbell_Raise_1.jpg", "./img/Good_Morning_0.jpg", "./img/Good_Morning_1.jpg", "./img/Handstand_Push-Ups_0.jpg", "./img/Handstand_Push-Ups_1.jpg", "./img/Hanging_Leg_Raise_0.jpg", "./img/Hanging_Leg_Raise_1.jpg", "./img/Hyperextensions_Back_Extensions_0.jpg", "./img/Hyperextensions_Back_Extensions_1.jpg", "./img/Incline_Dumbbell_Curl_0.jpg", "./img/Incline_Dumbbell_Curl_1.jpg", "./img/Incline_Dumbbell_Press_0.jpg", "./img/Incline_Dumbbell_Press_1.jpg", "./img/Inverted_Row_0.jpg", "./img/Inverted_Row_1.jpg", "./img/Kneeling_Hip_Flexor_0.jpg", "./img/Kneeling_Hip_Flexor_1.jpg", "./img/Leg_Extensions_0.jpg", "./img/Leg_Extensions_1.jpg", "./img/Leg_Press_0.jpg", "./img/Leg_Press_1.jpg", "./img/Lying_Leg_Curls_0.jpg", "./img/Lying_Leg_Curls_1.jpg", "./img/One-Arm_Dumbbell_Row_0.jpg", "./img/One-Arm_Dumbbell_Row_1.jpg", "./img/Palms-Down_Wrist_Curl_Over_A_Bench_0.jpg", "./img/Palms-Down_Wrist_Curl_Over_A_Bench_1.jpg", "./img/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench_0.jpg", "./img/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench_1.jpg", "./img/Plank_0.jpg", "./img/Plank_1.jpg", "./img/Plie_Dumbbell_Squat_0.jpg", "./img/Plie_Dumbbell_Squat_1.jpg", "./img/Preacher_Curl_0.jpg", "./img/Preacher_Curl_1.jpg", "./img/Pullups_0.jpg", "./img/Pullups_1.jpg", "./img/Pushups_0.jpg", "./img/Pushups_1.jpg", "./img/Reverse_Machine_Flyes_0.jpg", "./img/Reverse_Machine_Flyes_1.jpg", "./img/Rocking_Standing_Calf_Raise_0.jpg", "./img/Rocking_Standing_Calf_Raise_1.jpg", "./img/Romanian_Deadlift_0.jpg", "./img/Romanian_Deadlift_1.jpg", "./img/Rope_Jumping_0.jpg", "./img/Rope_Jumping_1.jpg", "./img/Rowing_Stationary_0.jpg", "./img/Rowing_Stationary_1.jpg", "./img/Seated_Cable_Rows_0.jpg", "./img/Seated_Cable_Rows_1.jpg", "./img/Seated_Calf_Raise_0.jpg", "./img/Seated_Calf_Raise_1.jpg", "./img/Side_Bridge_0.jpg", "./img/Side_Bridge_1.jpg", "./img/Side_Lateral_Raise_0.jpg", "./img/Side_Lateral_Raise_1.jpg", "./img/Standing_Calf_Raises_0.jpg", "./img/Standing_Calf_Raises_1.jpg", "./img/Standing_Military_Press_0.jpg", "./img/Standing_Military_Press_1.jpg", "./img/Superman_0.jpg", "./img/Superman_1.jpg", "./img/Thigh_Adductor_0.jpg", "./img/Thigh_Adductor_1.jpg", "./img/Triceps_Pushdown_0.jpg", "./img/Triceps_Pushdown_1.jpg", "./img/Upright_Barbell_Row_0.jpg", "./img/Upright_Barbell_Row_1.jpg", "./img/V-Bar_Pulldown_0.jpg", "./img/V-Bar_Pulldown_1.jpg", "./img/Wide-Grip_Lat_Pulldown_0.jpg", "./img/Wide-Grip_Lat_Pulldown_1.jpg"];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))
    .then(()=>self.clients.claim()));
});

/* La page elle-meme : reseau d'abord, cache en secours.
   Une nouvelle version est donc prise en compte des qu'il y a du reseau,
   et l'app continue de fonctionner hors ligne.                          */
function estPage(req){
  return req.mode==='navigate' || (req.destination==='document');
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  if(estPage(e.request)){
    e.respondWith(
      fetch(e.request).then(res=>{
        const c=res.clone(); caches.open(C).then(x=>x.put('./index.html',c));
        return res;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }
  /* Images, icones, manifeste : cache d'abord, c'est ce qui fait l'usage hors ligne. */
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    try{
      if(res.ok && new URL(e.request.url).origin===location.origin){
        const c=res.clone(); caches.open(C).then(x=>x.put(e.request,c));
      }
    }catch(_){}
    return res;
  }).catch(()=>r)));
});
