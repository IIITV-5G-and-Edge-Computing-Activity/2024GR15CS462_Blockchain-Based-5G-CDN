const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address
    const contract = await ethers.getContractAt("VideoCDN", contractAddress);

    const movies = [
        {
            title: "JOHN WICK",
            subtitle: "Chapter 3 - Parabellum (2019)",
            date: "May 17, 2019",
            genres: ["Action", "Thriller"],
            image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
            ipfsHash: "YOUR_VIDEO_IPFS_HASH_1",  // Replace with actual IPFS hash for this movie
            price: ethers.parseUnits("0.05", "ether"), // Adjust price as needed
            trailer: "https://www.youtube.com/watch?v=rUSdnuOLebE", // Replace with actual trailer URL
        },
        {
            title: "The Gorge",
            subtitle: "A thrilling action-packed adventure",
            date: "October 12, 2024",
            genres: ["Action", "Sci-Fi", "Mystery"],
            image:
                "https://m.media-amazon.com/images/M/MV5BOTQ5Y2QyYTktYmFmZi00NWJlLWE0MzgtYTA4M2I0ZjQwZjcxXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
            ipfsHash: "YOUR_VIDEO_IPFS_HASH_2",  // Replace with actual IPFS hash for this movie
            price: ethers.parseUnits("0.05", "ether"), // Adjust price as needed
            trailer: "https://www.youtube.com/watch?v=rUSdnuOLebE", // Replace with actual trailer URL
        },
        {
            title: "The Joker",
            subtitle: "Put on a happy face (2019)",
            date: "October 4, 2019",
            genres: ["Crime", "Drama", "Thriller"],
            image:
                "https://m.media-amazon.com/images/M/MV5BNzY3OWQ5NDktNWQ2OC00ZjdlLThkMmItMDhhNDk3NTFiZGU4XkEyXkFqcGc@._V1_.jpg",
            ipfsHash: "YOUR_VIDEO_IPFS_HASH_3",  // Replace with actual IPFS hash for this movie
            price: ethers.parseUnits("0.05", "ether"), // Adjust price as needed
            trailer: "https://www.youtube.com/watch?v=rUSdnuOLebE", // Replace with actual trailer URL
        },
        {
            title: "Alice in Borderland",
            subtitle: "Survive the game or die (2020)",
            date: "December 10, 2020",
            genres: ["Sci-Fi", "Thriller", "Survival"],
            image:
                "https://res.cloudinary.com/jnto/image/upload/w_1500,h_2222,c_fill,f_auto,fl_lossy,q_60/v1/media/filer_public/09/34/09346c21-3c37-4968-af66-5bf7fa42137c/aib_teaser_vertical_jp_rgb_es_qr5gfg",
            ipfsHash: "YOUR_VIDEO_IPFS_HASH_4",  // Replace with actual IPFS hash for this movie
            price: ethers.parseUnits("0.05", "ether"), // Adjust price as needed
            trailer: "https://www.youtube.com/watch?v=rUSdnuOLebE", // Replace with actual trailer URL
        },
        {
            title: "Game Of Thrones",
            subtitle: "Winter is Coming (2011-2019)",
            date: "April 17, 2011",
            genres: ["Fantasy", "Drama", "Adventure"],
            image:
                "https://ew.com/thmb/reQaMhcqNS7EJ0ICURbu2oV0RHA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/game-of-thrones-1-2000-fa124cd9a86049919b97184120240c4a.jpg",
            ipfsHash: "YOUR_VIDEO_IPFS_HASH_5",  // Replace with actual IPFS hash for this movie
            price: ethers.parseUnits("0.05", "ether"), // Adjust price as needed
            trailer: "https://www.youtube.com/watch?v=rUSdnuOLebE", // Replace with actual trailer URL
        },
    ];

    for (let movie of movies) {
        console.log(`📤 Uploading video: ${movie.title}...`);

        const tx = await contract.connect(owner).uploadVideo(
            movie.title,
            movie.subtitle,
            movie.date,
            movie.genres,
            movie.image,
            movie.ipfsHash,
            movie.price,
            movie.trailer
        );

        await tx.wait();
        console.log(`✅ ${movie.title} uploaded successfully!`);
    }

    // Verify upload
    const videos = await contract.getVideos();
    console.log("📺 Current videos:", videos);
}

// Run the script and handle errors
main().catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
});
