import { databases } from "@/lib/appwrite"; // Import Appwrite databases

export const getSafetyData = async () => {
  try {
    const response = await databases.listDocuments(
      "67b57da3000fd43c619a", // Replace with your database ID
      "67b5a262002bc11c0b92" // Replace with your collection ID
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching safety data:", error);
    throw error;
  }
};
