import { useQuery } from "@tanstack/react-query";
import { getLanguages } from "@/api/languages";

const LANGUAGES_QUERY_KEY = ["languages"];

export function useLanguages() {
  return useQuery({
    queryKey: LANGUAGES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await getLanguages();
      if (error) throw error;
      return data;
    },
  });
}
