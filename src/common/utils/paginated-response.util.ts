export function createPaginatedResponse({
  data,
  total,
  page,
  limit,
}: {
  data: any[];
  total: number;
  page: number;
  limit: number;
}) {
  return {
    data,

    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
