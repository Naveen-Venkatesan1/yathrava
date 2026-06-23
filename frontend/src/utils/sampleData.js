// src/utils/sampleData.js
// Generates realistic sample Indian Railways route data when Firestore is empty

const STATION_POOL = [
  { code: "NDLS", name: "New Delhi", city: "Delhi" },
  { code: "BCT", name: "Mumbai Central", city: "Mumbai" },
  { code: "MAS", name: "Chennai Central", city: "Chennai" },
  { code: "HWH", name: "Howrah Junction", city: "Kolkata" },
  { code: "SBC", name: "Bengaluru City", city: "Bengaluru" },
  { code: "SC", name: "Secunderabad Junction", city: "Hyderabad" },
  { code: "ADI", name: "Ahmedabad Junction", city: "Ahmedabad" },
  { code: "JP", name: "Jaipur Junction", city: "Jaipur" },
  { code: "LKO", name: "Lucknow Charbagh", city: "Lucknow" },
  { code: "CNB", name: "Kanpur Central", city: "Kanpur" },
  { code: "PNBE", name: "Patna Junction", city: "Patna" },
  { code: "BPL", name: "Bhopal Junction", city: "Bhopal" },
  { code: "NGP", name: "Nagpur Junction", city: "Nagpur" },
  { code: "PUNE", name: "Pune Junction", city: "Pune" },
  { code: "ST", name: "Surat", city: "Surat" },
  { code: "RTM", name: "Ratlam Junction", city: "Ratlam" },
  { code: "AGC", name: "Agra Cantonment", city: "Agra" },
  { code: "MTJ", name: "Mathura Junction", city: "Mathura" },
  { code: "GZB", name: "Ghaziabad Junction", city: "Ghaziabad" },
  { code: "ALJN", name: "Aligarh Junction", city: "Aligarh" },
  { code: "ET", name: "Itarsi Junction", city: "Itarsi" },
  { code: "JBP", name: "Jabalpur Junction", city: "Jabalpur" },
  { code: "MKP", name: "Manikpur Junction", city: "Manikpur" },
  { code: "ALD", name: "Prayagraj Junction", city: "Prayagraj" },
  { code: "MGS", name: "Mughal Sarai", city: "Varanasi" },
  { code: "GAYA", name: "Gaya Junction", city: "Gaya" },
  { code: "DHN", name: "Dhanbad Junction", city: "Dhanbad" },
  { code: "ASN", name: "Asansol Junction", city: "Asansol" },
  { code: "BRDG", name: "Barddhaman Junction", city: "Barddhaman" },
  { code: "KGP", name: "Kharagpur Junction", city: "Kharagpur" },
  { code: "BBS", name: "Bhubaneswar", city: "Bhubaneswar" },
  { code: "VSKP", name: "Visakhapatnam Junction", city: "Visakhapatnam" },
  { code: "BZA", name: "Vijayawada Junction", city: "Vijayawada" },
  { code: "GNT", name: "Guntur Junction", city: "Guntur" },
  { code: "NLR", name: "Nellore", city: "Nellore" },
  { code: "GDR", name: "Gudur Junction", city: "Gudur" },
  { code: "RU", name: "Renigunta Junction", city: "Tirupati" },
  { code: "MV", name: "Madurai Junction", city: "Madurai" },
  { code: "TUP", name: "Tiruppur", city: "Tiruppur" },
  { code: "CBE", name: "Coimbatore Junction", city: "Coimbatore" },
  { code: "ERS", name: "Ernakulam Junction", city: "Kochi" },
  { code: "TVC", name: "Trivandrum Central", city: "Thiruvananthapuram" },
  { code: "CSTM", name: "Mumbai CSMT", city: "Mumbai" },
  { code: "UBL", name: "Hubballi Junction", city: "Hubballi" },
  { code: "GNT", name: "Gadag Junction", city: "Gadag" },
  { code: "BIDR", name: "Bidar", city: "Bidar" },
  { code: "NED", name: "Nanded", city: "Nanded" },
  { code: "AWB", name: "Aurangabad", city: "Aurangabad" },
  { code: "MMR", name: "Manmad Junction", city: "Manmad" },
  { code: "DD", name: "Daund Junction", city: "Daund" },
  { code: "SLR", name: "Sholapur Junction", city: "Solapur" },
  { code: "GR", name: "Gulbarga", city: "Kalburgi" },
  { code: "YPR", name: "Yesvantpur Junction", city: "Bengaluru" },
  { code: "MYS", name: "Mysuru Junction", city: "Mysuru" },
  { code: "DWR", name: "Dharwad", city: "Dharwad" },
  { code: "BWT", name: "Bangarapet", city: "Bangarapet" },
  { code: "JTJ", name: "Jolarpettai Junction", city: "Jolarpettai" },
  { code: "SA", name: "Salem Junction", city: "Salem" },
  { code: "ED", name: "Erode Junction", city: "Erode" },
  { code: "TPJ", name: "Tiruchirappalli Junction", city: "Trichy" },
  { code: "MDU", name: "Madurai Junction", city: "Madurai" },
  { code: "NCJ", name: "Nagercoil Junction", city: "Nagercoil" },
  { code: "QLN", name: "Kollam Junction", city: "Kollam" },
  { code: "CLT", name: "Kozhikode", city: "Kozhikode" },
  { code: "SRR", name: "Shoranur Junction", city: "Shoranur" },
  { code: "PGT", name: "Palakkad Junction", city: "Palakkad" },
  { code: "PNI", name: "Punalur", city: "Punalur" },
  { code: "ALLP", name: "Alappuzha", city: "Alappuzha" },
  { code: "VC", name: "Vasco Da Gama", city: "Vasco" },
  { code: "MAO", name: "Madgaon Junction", city: "Goa" },
  { code: "KRMI", name: "Karwar", city: "Karwar" },
  { code: "MAJN", name: "Mangaluru Junction", city: "Mangaluru" },
  { code: "KPQ", name: "Kasaragod", city: "Kasaragod" },
  { code: "CAN", name: "Kannur", city: "Kannur" },
  { code: "NDC", name: "Nilambur Road", city: "Nilambur" },
  { code: "UDZ", name: "Udaipur City", city: "Udaipur" },
  { code: "AII", name: "Ajmer Junction", city: "Ajmer" },
  { code: "BKN", name: "Bikaner Junction", city: "Bikaner" },
  { code: "JU", name: "Jodhpur Junction", city: "Jodhpur" },
  { code: "BHL", name: "Barmer", city: "Barmer" },
  { code: "BGKT", name: "Bhagat Ki Kothi", city: "Jodhpur" },
  { code: "ASR", name: "Amritsar Junction", city: "Amritsar" },
  { code: "LDH", name: "Ludhiana Junction", city: "Ludhiana" },
  { code: "UMB", name: "Ambala Cantonment", city: "Ambala" },
  { code: "CDG", name: "Chandigarh", city: "Chandigarh" },
  { code: "SRE", name: "Saharanpur Junction", city: "Saharanpur" },
  { code: "HW", name: "Haridwar Junction", city: "Haridwar" },
  { code: "DDN", name: "Dehradun", city: "Dehradun" },
  { code: "RMR", name: "Ramnagar", city: "Ramnagar" },
  { code: "MBL", name: "Moradabad Junction", city: "Moradabad" },
  { code: "BRBR", name: "Bareilly Junction", city: "Bareilly" },
  { code: "MB", name: "Mughal Sarai Bypass", city: "Varanasi" },
  { code: "BSB", name: "Varanasi Junction", city: "Varanasi" },
  { code: "GKP", name: "Gorakhpur Junction", city: "Gorakhpur" },
  { code: "NKE", name: "Nautanwa", city: "Nautanwa" },
  { code: "GD", name: "Gonda Junction", city: "Gonda" },
  { code: "FD", name: "Faizabad Junction", city: "Ayodhya" },
  { code: "SLN", name: "Sultanpur Junction", city: "Sultanpur" },
  { code: "JNU", name: "Jaunpur Junction", city: "Jaunpur" },
];

const TRAIN_TYPES = ["Express", "Superfast", "Mail", "Rajdhani", "Shatabdi", "Jan Shatabdi", "Duronto", "Intercity", "Garib Rath"];

function pad(n) { return String(n).padStart(2, "0"); }

function addMinutes(time, mins) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

function pickStationsForRoute(src, dst, count) {
  // Get src/dst indices, then pick intermediate stations randomly
  const stations = [src];
  const pool = STATION_POOL.filter(s => s.code !== src.code && s.code !== dst.code);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count - 2; i++) {
    stations.push(shuffled[i]);
  }
  stations.push(dst);
  return stations;
}

function buildStopTimings(stationsArr) {
  let time = `${pad(Math.floor(Math.random() * 24))}:${pad(Math.floor(Math.random() * 60))}`;
  return stationsArr.map((stn, idx) => {
    if (idx === 0) {
      const dep = time;
      time = addMinutes(time, 30 + Math.floor(Math.random() * 90));
      return { code: stn.code, name: stn.name, city: stn.city, arrival: null, departure: dep, distance: 0, halt: 0 };
    }
    const arrival = time;
    const halt = idx === stationsArr.length - 1 ? 0 : 2 + Math.floor(Math.random() * 5);
    const departure = idx === stationsArr.length - 1 ? null : addMinutes(arrival, halt);
    time = addMinutes(departure || arrival, 30 + Math.floor(Math.random() * 90));
    return {
      code: stn.code,
      name: stn.name,
      city: stn.city,
      arrival,
      departure,
      distance: 0, // simplified
      halt,
    };
  });
}

export function generateSampleRoutes(count = 100) {
  const routes = [];
  const pool = STATION_POOL;

  for (let i = 0; i < count; i++) {
    const srcIdx = Math.floor(Math.random() * pool.length);
    let dstIdx = Math.floor(Math.random() * pool.length);
    while (dstIdx === srcIdx) dstIdx = Math.floor(Math.random() * pool.length);

    const src = pool[srcIdx];
    const dst = pool[dstIdx];
    const type = TRAIN_TYPES[Math.floor(Math.random() * TRAIN_TYPES.length)];
    const trainNumber = `${10000 + i + 1}`;
    const stopsCount = 4 + Math.floor(Math.random() * 7); // 4–10 stops
    const stationsArr = pickStationsForRoute(src, dst, stopsCount);
    const stops = buildStopTimings(stationsArr);
    const distance = 200 + Math.floor(Math.random() * 2800);
    const durationHrs = Math.max(2, Math.floor(distance / 65));
    const durationMins = Math.floor(Math.random() * 60);

    routes.push({
      id: `sample-${trainNumber}`,
      trainNumber,
      trainName: `${src.city} ${dst.city} ${type}`,
      sourceStation: src.name,
      sourceCode: src.code,
      destinationStation: dst.name,
      destinationCode: dst.code,
      distance,
      duration: `${durationHrs}h ${durationMins}m`,
      stations: stops,
      trainType: type,
      daysOfRun: ["Mon", "Wed", "Fri", "Sat"].slice(0, 2 + Math.floor(Math.random() * 3)).join(", "),
    });
  }

  return routes;
}
