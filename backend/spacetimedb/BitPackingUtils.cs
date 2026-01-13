using System;

public static class BitPackingUtils
{
    public static bool GetBit(byte[] array, int index)
    {
        if (index < 0 || index >= array.Length * 8)
            return false;
        
        int byteIndex = index / 8;
        int bitIndex = index % 8;
        return (array[byteIndex] & (1 << bitIndex)) != 0;
    }

    public static void SetBit(byte[] array, int index, bool value)
    {
        if (index < 0 || index >= array.Length * 8)
            return;
        
        int byteIndex = index / 8;
        int bitIndex = index % 8;
        
        if (value)
        {
            array[byteIndex] |= (byte)(1 << bitIndex);
        }
        else
        {
            array[byteIndex] &= (byte)~(1 << bitIndex);
        }
    }

    public static byte[] BoolArrayToByteArray(bool[] boolArray)
    {
        int byteCount = (boolArray.Length + 7) / 8;
        byte[] byteArray = new byte[byteCount];
        
        for (int i = 0; i < boolArray.Length; i++)
        {
            if (boolArray[i])
            {
                SetBit(byteArray, i, true);
            }
        }
        
        return byteArray;
    }

    public static bool[] ByteArrayToBoolArray(byte[] byteArray, int length)
    {
        bool[] boolArray = new bool[length];
        
        for (int i = 0; i < length; i++)
        {
            boolArray[i] = GetBit(byteArray, i);
        }
        
        return boolArray;
    }
}
