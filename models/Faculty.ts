import mongoose, { Schema, Document, models } from "mongoose"

export interface IFaculty extends Document {
  name: string
  email: string
  facultyCode: string
  username: string
  password: string
}

const FacultySchema = new Schema<IFaculty>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  facultyCode: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
})

// ✅ Prevent model overwrite (important in Next.js dev mode)
const Faculty = models.Faculty || mongoose.model<IFaculty>("Faculty", FacultySchema)

export default Faculty
