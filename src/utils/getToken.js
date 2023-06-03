const roomCodeMap = {
  listener: process.env.LISTENER_ROOM_CODE,
  speaker: process.env.SPEAKER_ROOM_CODE,
  moderator: process.env.MODERATOR_ROOM_CODE,
};
/**
 * @param {HMSActions} hmsActions
 * @param {String} userRole
 * @returns
 */
const getToken = async (hmsActions, userRole) => {
  const role = userRole.toLowerCase();
  const roomCode = roomCodeMap[role];
  const token = await hmsActions.getAuthTokenByRoomCode({ roomCode });
  return token;
};

export default getToken;
