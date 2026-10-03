"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { Camera, User } from "lucide-react";

type ProfileContextValue = {
	profileImage: string | null;
	openFilePicker: () => void;
	user: any | null;
	refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);
const LEGACY_STORAGE_KEY = "rrce-erp-profile-image";

async function createOptimizedImage(file: File): Promise<string> {
	const image = await createImageBitmap(file);
	const maxDimension = 512;
	const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(image.width * scale);
	canvas.height = Math.round(image.height * scale);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not process profile image");
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	image.close();
	return canvas.toDataURL("image/jpeg", 0.88);
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [user, setUser] = useState<any | null>(null);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const profileImageRef = useRef<string | null>(null);
	const uploadRequestRef = useRef(0);

	const loadUserAndImage = useCallback(async () => {
		try {
			const res = await fetch("/api/auth/me", { cache: "no-store" });
			if (!res.ok) {
				setUser(null);
				setProfileImage(null);
				return;
			}
			const data = await res.json();
			const currentUser = data.user;
			setUser(currentUser);

			if (!currentUser) {
				setProfileImage(null);
				return;
			}

			// Clean user-specific storage key based on USN, username, or ID
			const userKey = (
				currentUser.usn ||
				currentUser.studentProfile?.usn ||
				currentUser.username ||
				currentUser.id ||
				""
			)
				.toLowerCase()
				.trim();

			// MIGRATION & ISOLATION:
			// If legacy un-scoped key exists, migrate it to Gagan (1RR25BC007) only if current user is Gagan,
			// and delete the legacy un-scoped key immediately so it never pollutes other students.
			const legacyImage = window.localStorage.getItem(LEGACY_STORAGE_KEY);
			if (legacyImage) {
				if (userKey === "1rr25bc007") {
					window.localStorage.setItem(`rrce-erp-profile-image-${userKey}`, legacyImage);
				}
				window.localStorage.removeItem(LEGACY_STORAGE_KEY);
			}

			// 1. Check if backend user object has photoUrl
			if (currentUser.photoUrl) {
				setProfileImage(currentUser.photoUrl);
				return;
			}

			// 2. Check user-scoped localStorage
			if (userKey) {
				const scopedImage = window.localStorage.getItem(
					`rrce-erp-profile-image-${userKey}`
				);
				setProfileImage(scopedImage || null);
			} else {
				setProfileImage(null);
			}
		} catch (error) {
			console.warn("Could not load profile session:", error);
			setProfileImage(null);
		}
	}, []);

	useEffect(() => {
		void loadUserAndImage();
		return () => {
			if (profileImageRef.current) URL.revokeObjectURL(profileImageRef.current);
		};
	}, [pathname, loadUserAndImage]);

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		event.target.value = "";
		if (!file.type.startsWith("image/")) return;

		const requestId = ++uploadRequestRef.current;
		const previewUrl = URL.createObjectURL(file);
		if (profileImageRef.current) URL.revokeObjectURL(profileImageRef.current);
		profileImageRef.current = previewUrl;
		setProfileImage(previewUrl);

		try {
			const imageData = await createOptimizedImage(file);
			if (requestId !== uploadRequestRef.current) return;

			const userKey = (
				user?.usn ||
				user?.studentProfile?.usn ||
				user?.username ||
				user?.id ||
				"default"
			)
				.toLowerCase()
				.trim();

			// Save scoped to this user only
			window.localStorage.setItem(`rrce-erp-profile-image-${userKey}`, imageData);
			// Also remove any lingering legacy global key
			window.localStorage.removeItem(LEGACY_STORAGE_KEY);

			setProfileImage(imageData);
			URL.revokeObjectURL(previewUrl);
			profileImageRef.current = null;

			// Persist to backend database for this user
			void fetch("/api/auth/profile-photo", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ photoUrl: imageData }),
			}).catch((err) => console.warn("Failed to persist photo to DB:", err));
		} catch (error) {
			console.warn("Could not save profile image:", error);
		}
	}

	return (
		<ProfileContext.Provider
			value={{
				profileImage,
				openFilePicker,
				user,
				refreshProfile: loadUserAndImage,
			}}
		>
			{children}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
		</ProfileContext.Provider>
	);
}

export function useProfile() {
	const context = useContext(ProfileContext);
	if (!context) throw new Error("useProfile must be used within ProfileProvider");
	return context;
}

export function ProfileAvatar({
	sizeClassName,
	customImage,
	name,
}: {
	sizeClassName: string;
	customImage?: string | null;
	name?: string;
}) {
	const { profileImage, openFilePicker, user } = useProfile();

	const activeImage = customImage !== undefined ? customImage : profileImage;

	// Calculate clean student initials if no image is uploaded
	const displayName = name || (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "");
	const initials = displayName
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	return (
		<button
			type="button"
			onClick={openFilePicker}
			aria-label="Upload profile picture"
			className={`group relative ${sizeClassName} shrink-0 overflow-hidden rounded-full bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 flex items-center justify-center`}
		>
			{activeImage ? (
				<img src={activeImage} alt="Profile" className="h-full w-full object-cover" />
			) : initials ? (
				<span className="font-semibold text-xs sm:text-sm text-zinc-700 tracking-wider font-sans select-none">
					{initials}
				</span>
			) : (
				<User aria-hidden="true" className="h-full w-full p-2.5 text-zinc-400" />
			)}
			<span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
				<Camera aria-hidden="true" className="h-3.5 w-3.5" />
			</span>
		</button>
	);
}
