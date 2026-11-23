#!/usr/bin/env bash
# 합성으로 만드는 소리들. 다시 만들려면: bash scripts/make-sounds.sh
# 필요한 것: ffmpeg (brew install ffmpeg)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/sounds/sfx assets/sounds/wake assets/placeholder/sounds
F=(ffmpeg -hide_banner -loglevel error -y)

# 미션 효과음 (m4a)
sfx() { "${F[@]}" -f lavfi -i "aevalsrc='$2':s=44100:d=$3" -af "volume=0.6,alimiter=limit=0.6:level=false" -c:a aac -b:a 128k "assets/sounds/sfx/$1.m4a"; }
sfx tick    "sin(2*PI*1500*t)*exp(-t*80)" 0.06
sfx count   "sin(2*PI*880*t)*exp(-t*14)*(1-exp(-t*600))" 0.25
sfx rep     "sin(2*PI*784*t)*exp(-t*30)*(1-exp(-t*600))+0.3*sin(2*PI*1568*t)*exp(-t*45)" 0.12
sfx success "sin(2*PI*if(lt(t,0.12),523,if(lt(t,0.24),659,if(lt(t,0.36),784,1046)))*t)*if(gte(t,0.36),exp(-(t-0.36)*4),exp(-mod(t,0.12)*6))*(1-exp(-mod(t,0.12)*600))" 0.8
sfx fail    "0.8*sin(2*PI*if(lt(t,0.2),330,247)*t)*exp(-mod(t,0.2)*8)*(1-exp(-mod(t,0.2)*600))" 0.45

# 기상음 (caf, 28초: iOS 알람 소리는 30초 이하)
wake() { "${F[@]}" -f lavfi -i "aevalsrc='$3':s=22050:d=28" -af "loudnorm=I=-14:TP=-1" -ar 22050 -ac 1 -c:a pcm_s16le "$2/$1.caf"; }
wake classic assets/sounds/wake \
  "0.7*sin(2*PI*1000*t)*lt(mod(t,1.4),0.8)*lt(mod(t,0.2),0.1)"
# 아래 둘은 임시 (사운드 디자이너 파일이 오면 교체)
wake dawn_bell assets/placeholder/sounds \
  "0.4*(1-exp(-mod(t,3)*300))*(sin(2*PI*523*t)*exp(-mod(t,3)*1.2)+0.6*sin(2*PI*1046*t)*exp(-mod(t,3)*1.8)+0.4*sin(2*PI*1444*t)*exp(-mod(t,3)*2.5)+0.25*sin(2*PI*2825*t)*exp(-mod(t,3)*4))"
N="floor(mod(t,3.2)/0.4)"
wake xylophone assets/placeholder/sounds \
  "0.6*(1-exp(-mod(t,0.4)*500))*exp(-mod(t,0.4)*9)*sin(2*PI*if(eq($N,0),523,if(eq($N,1),659,if(eq($N,2),784,if(eq($N,3),1046,if(eq($N,4),880,if(eq($N,5),784,if(eq($N,6),659,587)))))))*t)"

# 장면 소리 임시 (5분, 정적인 잡음이라 이어 붙여도 이음새가 안 들려요)
"${F[@]}" -f lavfi -i "anoisesrc=color=pink:sample_rate=44100:duration=300:amplitude=0.5" \
  -af "lowpass=f=1800,highpass=f=80,loudnorm=I=-24" -c:a aac -b:a 96k assets/placeholder/sounds/scene_fan.m4a
"${F[@]}" -f lavfi -i "anoisesrc=color=brown:sample_rate=44100:duration=300:amplitude=0.6" \
  -af "lowpass=f=900,tremolo=f=0.1:d=0.4,loudnorm=I=-24" -c:a aac -b:a 96k assets/placeholder/sounds/scene_snow.m4a

# 백색·분홍·갈색 소음 (SPEC 8장). 2분짜리를 반복해요. 잡음이라 이어 붙여도 이음새가 안 들려요.
mkdir -p assets/sounds/noise
for c in white pink brown; do
  "${F[@]}" -f lavfi -i "anoisesrc=color=${c}:sample_rate=44100:duration=120:amplitude=0.6" -af "highpass=f=30,loudnorm=I=-26:TP=-3" -ac 1 -c:a aac -b:a 96k "assets/sounds/noise/${c}.m4a"
done
