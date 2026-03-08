from analysis import seq_align,del_cost


#testing allignments

if __name__ == "__main__":
    seq1 = "ACTGATTCA"
    #seq1 = input("\n Enter your first DNA sequence: ")
    lenSeq1 = len(seq1)
    seq2 = "ACGCATCA"
    #seq2 = input("\n Enter your second DNA sequence: ")
    lenSeq2 = len(seq2)
    seq_align(seq1, seq2)
    
    print("Best Possible Alignment Score: " + str((max(lenSeq1,lenSeq2) * 2) - del_cost(abs(lenSeq1-lenSeq2))))