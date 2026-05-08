export type JwtAccessPayload = {
  sub: number;
  deviceId: string;
};

export type JwtRefreshPayload = {
  sub: string;
  deviceId: string;
  tokenId: string;
};
