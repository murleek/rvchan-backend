export type JwtAccessPayload = {
  sub: string;
};

export type JwtRefreshPayload = {
  sub: string;
  tokenId: string;
};
