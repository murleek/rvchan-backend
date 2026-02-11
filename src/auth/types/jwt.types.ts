export type JwtAccessPayload = {
  sub: string;
  deviceId: string;
};

export type JwtRefreshPayload = {
  sub: string;
  deviceId: string;
  tokenId: string;
};
