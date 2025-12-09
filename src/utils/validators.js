// Custom validators

const isValidSaudiPhone = (phone) => {
  return /^05\d{8}$/.test(phone);
};

const isValidNationalId = (nationalId) => {
  return /^\d{10}$/.test(nationalId);
};

const isValidTimeFormat = (time) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const isValidTeam = (team) => {
  const validTeams = ['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب'];
  return validTeams.includes(team);
};

const isValidZone = (zone) => {
  const validZones = ['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan'];
  return validZones.includes(zone);
};

module.exports = {
  isValidSaudiPhone,
  isValidNationalId,
  isValidTimeFormat,
  isValidTeam,
  isValidZone
};


