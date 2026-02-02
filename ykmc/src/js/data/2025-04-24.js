dataSetVersion = "2025-04-24"; // Change this when creating a new data set version. YYYY-MM-DD format.
dataSet[dataSetVersion] = {};

dataSet[dataSetVersion].options = [
  {
    name: "Filter by band",
    key: "band",
    tooltip: "Check this to restrict to characters from certain bands.",
    checked: false,
    sub: [
      { name: "Poppin' Party!", key: "pop" },
      { name: "Afterglow", key: "after" },
      { name: "Roselia", key: "rose" },
      { name: "Pastel*Palettes", key: "pasu" },
      { name: "Hello, Happy World!", key: "hhw" },
      { name: "RAISE A SUILEN", key: "ras" },
      { name: "Morfonica", key: "morf" },
      { name: "MyGO!!!!!", key: "mygo" },
      { name: "Ave Mujica", key: "ave" },
      { name: "Mugendai Mewtype", key: "mugendai" },
    ]
  },
  {
    name: "Filter by role",
    key: "role",
    tooltip: "Check this to restrict to characters from certain role in a band.",
    checked: false,
    sub: [
      { name: "Vocalist", key: "vo" },
      { name: "Guitarist", key: "gt" },
      { name: "Bassist", key: "bs" },
      { name: "Drummer", key: "dr" },
      { name: "Keyboardist/Violin", key: "kb" },
      { name: "DJ", key: "dj" },
    ]
  },
];

dataSet[dataSetVersion].characterData = [
  {
    name: "Toyama Kasumi",
    img: "kasumi.png",
    opts: {
      band: ["pop"],
      role: ["vo", "gt"],
    }
  },
  {
    name: "Hanazono Tae",
    img: "otae.png",
    opts: {
      band: ["pop"],
      role: ["gt"],
    }
  }, 
  {
    name: "Ushigome Rimi",
    img: "rimi.png",
    opts: {
      band: ["pop"],
      role: ["bs"],
    }
  },
  {
    name: "Yamabuki Saaya",
    img: "saaya.png",
    opts: {
      band: ["pop"],
      role: ["dr"],
    }
  },
  {
    name: "Ichigaya Arisa",
    img: "arisa.png",
    opts: {
      band: ["pop"],
      role: ["kb"],
    }
  },
  {
    name: "Mitake Ran",
    img: "ran.png",
    opts: {
      band: ["after"],
      role: ["vo", "gt"],
    }
  },
  {
    name: "Aoba Moca",
    img: "moca.png",
    opts: {
      band: ["after"],
      role: ["gt"],
    }
  }, 
  {
    name: "Uehara Himari",
    img: "himari.png",
    opts: {
      band: ["after"],
      role: ["bs"],
    }
  },
  {
    name: "Udagawa Tomoe",
    img: "tomoe.png",
    opts: {
      band: ["after"],
      role: ["dr"],
    }
  },
  {
    name: "Hazawa Tsugumi",
    img: "tsugu.png",
    opts: {
      band: ["after"],
      role: ["kb"],
    }
  },
  {
    name: "Maruyama Aya",
    img: "aya.png",
    opts: {
      band: ["pasu"],
      role: ["vo"],
    }
  },
  {
    name: "Hikawa Hina",
    img: "hina.png",
    opts: {
      band: ["pasu"],
      role: ["gt"],
    }
  }, 
  {
    name: "Shirasagi Chisato",
    img: "chisato.png",
    opts: {
      band: ["pasu"],
      role: ["bs"],
    }
  },
  {
    name: "Yamato Maya",
    img: "maya.png",
    opts: {
      band: ["pasu"],
      role: ["dr"],
    }
  },
  {
    name: "Wakamiya Eve",
    img: "eve.png",
    opts: {
      band: ["pasu"],
      role: ["kb"],
    }
  },
  {
    name: "Minato Yukina",
    img: "yukina.png",
    opts: {
      band: ["rose"],
      role: ["vo"],
    }
  },
  {
    name: "Hikawa Sayo",
    img: "sayo.png",
    opts: {
      band: ["rose"],
      role: ["gt"],
    }
  }, 
  {
    name: "Imai Lisa",
    img: "lisa.png",
    opts: {
      band: ["rose"],
      role: ["bs"],
    }
  },
  {
    name: "Udagawa Ako",
    img: "ako.png",
    opts: {
      band: ["rose"],
      role: ["dr"],
    }
  },
  {
    name: "Shirokane Rinko",
    img: "rinko.png",
    opts: {
      band: ["rose"],
      role: ["kb"],
    }
  },
  {
    name: "Tsurumaki Kokoro",
    img: "kokoro.png",
    opts: {
      band: ["hhw"],
      role: ["vo"],
    }
  },
  {
    name: "Seta Kaoru",
    img: "kaoru.png",
    opts: {
      band: ["hhw"],
      role: ["gt"],
    }
  }, 
  {
    name: "Kitazawa Hagumi",
    img: "hagumi.png",
    opts: {
      band: ["hhw"],
      role: ["bs"],
    }
  },
  {
    name: "Matsubara Kanon",
    img: "kanon.png",
    opts: {
      band: ["hhw"],
      role: ["dr"],
    }
  },
  {
    name: "Okusawa Misaki",
    img: "misaki.png",
    opts: {
      band: ["hhw"],
      role: ["dj"],
    }
  },
  {
    name: "Kurata Mashiro",
    img: "mashiro.png",
    opts: {
      band: ["morf"],
      role: ["vo"],
    }
  },
  {
    name: "Kirigaya Touko",
    img: "touko.png",
    opts: {
      band: ["morf"],
      role: ["gt"],
    }
  }, 
  {
    name: "Hiromachi Nanami",
    img: "nanami.png",
    opts: {
      band: ["morf"],
      role: ["bs"],
    }
  },
  {
    name: "Futaba Tsukushi",
    img: "tsukushi.png",
    opts: {
      band: ["morf"],
      role: ["dr"],
    }
  },
  {
    name: "Yashio Rui",
    img: "rui.png",
    opts: {
      band: ["morf"],
      role: ["kb"],
    }
  },
  {
    name: "LAYER",
    img: "layer.png",
    opts: {
      band: ["ras"],
      role: ["vo", "bs"],
    }
  },
  {
    name: "LOCK",
    img: "lock.png",
    opts: {
      band: ["ras"],
      role: ["gt"],
    }
  }, 
  {
    name: "MASKING",
    img: "masking.png",
    opts: {
      band: ["ras"],
      role: ["dr"],
    }
  },
  {
    name: "PAREO",
    img: "pareo.png",
    opts: {
      band: ["ras"],
      role: ["kb"],
    }
  },
  {
    name: "CHU2",
    img: "chu2.png",
    opts: {
      band: ["ras"],
      role: ["dj"],
    }
  },
  {
    name: "Takamatsu Tomori",
    img: "tomori.png",
    opts: {
      band: ["mygo"],
      role: ["vo"],
    }
  },
  {
    name: "Shiina Taki",
    img: "taki.png",
    opts: {
      band: ["mygo"],
      role: ["dr"],
    }
  }, 
  {
    name: "Kaname Raana",
    img: "raana.png",
    opts: {
      band: ["mygo"],
      role: ["gt"],
    }
  },
  {
    name: "Chihaya Anon",
    img: "anon.png",
    opts: {
      band: ["mygo"],
      role: ["gt"],
    }
  },
  {
    name: "Nagasaki Soyo",
    img: "soyo.png",
    opts: {
      band: ["mygo"],
      role: ["bs"],
    }
  },
  {
    name: "Doloris (Misumi Hatsune/Uika)",
    img: "uika.png",
    opts: {
      band: ["ave"],
      role: ["vo", "gt"],
    }
  },
  {
    name: "Mortis (Wakaba Mutsumi)",
    img: "mutsumi.png",
    opts: {
      band: ["ave"],
      role: ["gt"],
    }
  }, 
  {
    name: "Timoris (Yahata Umiri)",
    img: "umiri.png",
    opts: {
      band: ["ave"],
      role: ["bs"],
    }
  },
  {
    name: "Amoris (Yuutenji Nyamu)",
    img: "nyamu.png",
    opts: {
      band: ["ave"],
      role: ["dr"],
    }
  },
  {
    name: "Oblivionis (Togawa Sakiko)",
    img: "sakiko.png",
    opts: {
      band: ["ave"],
      role: ["kb"],
    }
  },
  {
    name: "Nakamachi Arale",
    img: "arale.png",
    opts: {
      band: ["mugendai"],
      role: ["vo"],
    }
  },
  {
    name: "Miyanaga Nonoka",
    img: "nonoka.png",
    opts: {
      band: ["mugendai"],
      role: ["gt"],
    }
  }, 
  {
    name: "Minetsuki Ritsu",
    img: "ritsu.png",
    opts: {
      band: ["mugendai"],
      role: ["gt"],
    }
  },
  {
    name: "Fuji Miyako",
    img: "miyako.png",
    opts: {
      band: ["mugendai"],
      role: ["kb"],
    }
  },
  {
    name: "Sengoku Yuno",
    img: "yuno.png",
    opts: {
      band: ["mugendai"],
      role: ["dj"],
    }
  },
]
