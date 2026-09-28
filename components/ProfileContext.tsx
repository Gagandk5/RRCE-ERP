"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";

type ProfileContextValue = {
	profileImage: string | null;
	openFilePicker: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const profileImageRef = useRef<string | null>(null);

	useEffect(() => () => {
		if (profileImageRef.current) URL.revokeObjectURL(profileImageRef.current);
	}, []);

	function openFilePicker() {
		fileInputRef.current?.click();
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		const imageUrl = URL.createObjectURL(file);
		if (profileImageRef.current) URL.revokeObjectURL(profileImageRef.current);
		profileImageRef.current = imageUrl;
		setProfileImage(imageUrl);
		event.target.value = "";
	}

	return (
		<ProfileContext.Provider value={{ profileImage, openFilePicker }}>
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

export function ProfileAvatar({ sizeClassName }: { sizeClassName: string }) {
	const { profileImage, openFilePicker } = useProfile();

	return (
		<button
			type="button"
			onClick={openFilePicker}
			aria-label="Upload profile picture"
			className={`group relative ${sizeClassName} shrink-0 overflow-hidden rounded-full bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500`}
		>
			{profileImage ? (
				<img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
			) : (
				<User aria-hidden="true" className="h-full w-full p-2.5" />
			)}
			<span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
				<Camera aria-hidden="true" className="h-4 w-4" />
			</span>
		</button>
	);
}
