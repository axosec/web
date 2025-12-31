import type { ItemType } from "@repo/api/vault";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import { FieldError } from "@repo/ui/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Lock, CreditCard, StickyNote, Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { MetadataSchema, LoginSchema, CardSchema, NoteSchema } from "./item-options";
import { FOLDER_COLORS, FOLDER_ICONS } from "./folder-options";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { Check } from "lucide-react";

import type { DecryptedItem } from "./item-options";

interface CreateItemProps {
	onSubmit: (type: ItemType, values: any) => Promise<void>
	initialData?: DecryptedItem | null
	initialDetails?: any
}

export default function CreateItem({ onSubmit, initialData, initialDetails }: CreateItemProps) {
	const [activeType, setActiveType] = useState<ItemType>((initialData?.type as ItemType) || "login")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const defaultValues = {
		title: initialData?.title || "",
		icon: initialData?.icon || "default",
		color: initialData?.color || "default",
		username: initialDetails?.username || "",
		password: initialDetails?.password || "",
		url: (initialDetails?.url as string[]) || [],
		cardholder: initialDetails?.cardholder || "",
		number: initialDetails?.number || "",
		expiry: initialDetails?.expiry || "",
		cvv: initialDetails?.cvv || "",
		pin: initialDetails?.pin || "",
		content: initialDetails?.content || "",
	};

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: ({ value }) => {
				let schema = MetadataSchema;
				if (activeType === "login") schema = MetadataSchema.extend(LoginSchema.shape);
				if (activeType === "card") schema = MetadataSchema.extend(CardSchema.shape);
				if (activeType === "note") schema = MetadataSchema.extend(NoteSchema.shape);

				const result = schema.safeParse(value);
				if (!result.success) return "Please correct the errors in the form.";
				return undefined;
			}
		},
		onSubmit: async ({ value }) => {
			setIsSubmitting(true)
			try {
				const cleanedValues = {
					...value,
					url: value.url?.filter((u: string) => u.trim() !== "") || []
				};
				await onSubmit(activeType, cleanedValues)
				form.reset()
			} catch (err) {
				console.error(err)
			} finally {
				setIsSubmitting(false)
			}
		},
	})

	const showFieldError = (fieldMeta: { isTouched: boolean }, submissionAttempts: number) =>
		fieldMeta.isTouched || submissionAttempts > 0;

	return (
		<div>
			<h1 className="text-2xl font-bold pb-2">{initialData ? "Update Item" : "Create Item"}</h1>
			<Tabs value={activeType} onValueChange={(v) => setActiveType(v as ItemType)} className="w-full">
				<TabsList className="grid w-full grid-cols-3 mb-4">
					<TabsTrigger value="login"><Lock className="w-4 h-4 mr-2" /> Login</TabsTrigger>
					<TabsTrigger value="card"><CreditCard className="w-4 h-4 mr-2" /> Card</TabsTrigger>
					<TabsTrigger value="note"><StickyNote className="w-4 h-4 mr-2" /> Note</TabsTrigger>
				</TabsList>
			</Tabs>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
				<form.Field
					name="title"
					validators={{ onChange: MetadataSchema.shape.title }}
					children={(field) => {
						const shouldShow = showFieldError(
							field.state.meta,
							form.state.submissionAttempts ?? 0
						);
						const isInvalid = shouldShow && !field.state.meta.isValid;
						return (
							<div className="grid gap-2">
								<Label htmlFor={field.name}>Title</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="e.g. Netflix"
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</div>
						)
					}}
				/>

				<div className="grid grid-cols-2 gap-4">
					<form.Field
						name="icon"
						validators={{ onChange: z.string() }}
						children={(field) => {
							const activeIcon = FOLDER_ICONS.find(i => i.id === field.state.value) || FOLDER_ICONS[0];
							const Icon = activeIcon.icon;
							return (
								<div className="grid gap-2">
									<Label>Icon</Label>
									<DropdownMenu>
										<DropdownMenuTrigger render={
											<Button variant="outline" className="justify-between w-full">
												<span className="flex items-center gap-2">
													<Icon className="size-4" />
													<span className="capitalize">{activeIcon.id}</span>
												</span>
											</Button>
										} />
										<DropdownMenuContent className="w-64 p-2" align="start">
											<div className="grid grid-cols-5 gap-1">
												{FOLDER_ICONS.map((icon) => (
													<Button
														key={icon.id}
														variant="ghost"
														size="icon"
														className={cn(
															"size-10",
															field.state.value === icon.id && "bg-muted"
														)}
														onClick={() => field.handleChange(icon.id)}
													>
														<icon.icon className="size-5" />
													</Button>
												))}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)
						}}
					/>
					<form.Field
						name="color"
						validators={{ onChange: z.string() }}
						children={(field) => {
							const activeColor = FOLDER_COLORS.find(c => c.id === field.state.value) || FOLDER_COLORS[0];
							return (
								<div className="grid gap-2">
									<Label>Color</Label>
									<DropdownMenu>
										<DropdownMenuTrigger render={
											<Button variant="outline" className="justify-between w-full">
												<span className="flex items-center gap-2">
													<div className={`size-4 rounded-full ${activeColor.bg}`} />
													<span className="capitalize">{activeColor.id}</span>
												</span>
											</Button>
										} />
										<DropdownMenuContent className="w-64 p-2" align="start">
											<div className="grid grid-cols-5 gap-1">
												{FOLDER_COLORS.map((color) => (
													<Button
														key={color.id}
														variant="ghost"
														size="icon"
														className={cn(
															"size-10",
															field.state.value === color.id && "bg-muted"
														)}
														onClick={() => field.handleChange(color.id)}
													>
														<div className={`size-6 rounded-full ${color.bg} flex items-center justify-center`}>
															{field.state.value === color.id && <Check className="size-4 text-white" />}
														</div>
													</Button>
												))}
											</div>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							)
						}}
					/>
				</div>

				{activeType === "login" && (
					<>
						<div className="grid grid-cols-2 gap-4">
							<form.Field
								name="username"
								children={(field) => (
									<div className="grid gap-2">
										<Label>Username</Label>
										<Input
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							/>
							<form.Field
								name="password"
								validators={{ onChange: LoginSchema.shape.password }}
								children={(field) => {
									const shouldShow = showFieldError(
										field.state.meta,
										form.state.submissionAttempts ?? 0
									);
									const isInvalid = shouldShow && !field.state.meta.isValid;
									return (
										<div className="grid gap-2">
											<Label>Password</Label>
											<Input
												type="password"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</div>
									)
								}}
							/>
						</div>
						<form.Field
							name="url"
							mode="array"
							validators={{ onChange: LoginSchema.shape.url }}
							children={(field) => {
								return (
									<div className="grid gap-2">
										<Label>URLs</Label>
										{field.state.value.map((_, i) => (
											<div key={i} className="flex gap-2">
												<form.Field
													name={`url[${i}]`}
													validators={{
														onChange: z.string(),
													}}
													children={(subField) => {
														const shouldShow = showFieldError(
															subField.state.meta,
															form.state.submissionAttempts ?? 0
														);
														const isInvalid = shouldShow && !subField.state.meta.isValid;
														return (
															<div className="grid gap-2 flex-1">
																<Input
																	placeholder="https://example.com"
																	value={subField.state.value}
																	onBlur={subField.handleBlur}
																	onChange={(e) => subField.handleChange(e.target.value)}
																/>
																{isInvalid && <FieldError errors={subField.state.meta.errors} />}
															</div>
														)
													}}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => field.removeValue(i)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-2 w-full"
											onClick={() => field.pushValue("")}
										>
											<Plus className="w-4 h-4 mr-2" />
											Add URL
										</Button>
									</div>
								)
							}}
						/>
					</>
				)}

				{activeType === "card" && (
					<>
						<form.Field
							name="cardholder"
							validators={{ onChange: CardSchema.shape.cardholder }}
							children={(field) => {
								const shouldShow = showFieldError(
									field.state.meta,
									form.state.submissionAttempts ?? 0
								);
								const isInvalid = shouldShow && !field.state.meta.isValid;
								return (
									<div className="grid gap-2">
										<Label>Cardholder Name</Label>
										<Input
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</div>
								)
							}}
						/>
						<form.Field
							name="number"
							validators={{ onChange: CardSchema.shape.number }}
							children={(field) => {
								const shouldShow = showFieldError(
									field.state.meta,
									form.state.submissionAttempts ?? 0
								);
								const isInvalid = shouldShow && !field.state.meta.isValid;
								return (
									<div className="grid gap-2">
										<Label>Card Number</Label>
										<Input
											placeholder="0000 0000 0000 0000"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{isInvalid && <FieldError errors={field.state.meta.errors} />}
									</div>
								)
							}}
						/>
						<div className="grid grid-cols-3 gap-4">
							<form.Field
								name="expiry"
								validators={{ onChange: CardSchema.shape.expiry }}
								children={(field) => {
									const shouldShow = showFieldError(
										field.state.meta,
										form.state.submissionAttempts ?? 0
									);
									const isInvalid = shouldShow && !field.state.meta.isValid;
									return (
										<div className="grid gap-2">
											<Label>Expiry (MM/YY)</Label>
											<Input
												placeholder="12/25"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</div>
									)
								}}
							/>
							<form.Field
								name="cvv"
								validators={{ onChange: CardSchema.shape.cvv }}
								children={(field) => {
									const shouldShow = showFieldError(
										field.state.meta,
										form.state.submissionAttempts ?? 0
									);
									const isInvalid = shouldShow && !field.state.meta.isValid;
									return (
										<div className="grid gap-2">
											<Label>CVV</Label>
											<Input
												type="password"
												maxLength={4}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</div>
									)
								}}
							/>
							<form.Field
								name="pin"
								validators={{ onChange: CardSchema.shape.pin }}
								children={(field) => {
									const shouldShow = showFieldError(
										field.state.meta,
										form.state.submissionAttempts ?? 0
									);
									const isInvalid = shouldShow && !field.state.meta.isValid;
									return (
										<div className="grid gap-2">
											<Label>PIN</Label>
											<Input
												type="password"
												maxLength={6}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
											{isInvalid && <FieldError errors={field.state.meta.errors} />}
										</div>
									)
								}}
							/>
						</div>
					</>
				)}

				{activeType === "note" && (
					<form.Field
						name="content"
						validators={{ onChange: NoteSchema.shape.content }}
						children={(field) => {
							const shouldShow = showFieldError(
								field.state.meta,
								form.state.submissionAttempts ?? 0
							);
							const isInvalid = shouldShow && !field.state.meta.isValid;
							return (
								<div className="grid gap-2">
									<Label>Note Content</Label>
									<Textarea
										className="min-h-[150px]"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</div>
							)
						}}
					/>
				)}

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					<Save className="w-4 h-4 mr-2" />
					{initialData ? "Update Item" : "Save Item"}
				</Button>
			</form>
		</div>
	);
}