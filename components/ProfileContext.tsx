"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";

type ProfileContextValue = {
	profileImage: string | null;
	openFilePicker: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);
const PROFILE_IMAGE_STORAGE_KEY = "rrce-erp-profile-image";

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
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const profileImageRef = useRef<string | null>(null);
	const uploadRequestRef = useRef(0);

	useEffect(() => {
		try {
			setProfileImage(window.localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY));
		} catch (error) {
			console.warn("Could not load saved profile image:", error);
		}
		return () => {
			if (profileImageRef.current) URL.revokeObjectURL(profileImageRef.current);
		};
	}, []);

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
			window.localStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, imageData);
			setProfileImage(imageData);
			URL.revokeObjectURL(previewUrl);
			profileImageRef.current = null;
		} catch (error) {
			console.warn("Could not save profile image:", error);
		}
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
