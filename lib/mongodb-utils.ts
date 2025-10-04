import { ObjectId } from 'mongodb';

export function toObjectId(id: string | ObjectId): ObjectId {
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  throw new Error(`Invalid ObjectId: ${id}`);
}

export function toStringId(id: ObjectId | string): string {
  return id.toString();
}

export function toClientObject<T extends { _id: ObjectId }>(doc: T): Omit<T, '_id'> & { _id: string; id: string } {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id.toString(),
    id: _id.toString()
  } as any;
}

export function toClientArray<T extends { _id: ObjectId }>(docs: T[]): Array<Omit<T, '_id'> & { _id: string; id: string }> {
  return docs.map(doc => toClientObject(doc));
}